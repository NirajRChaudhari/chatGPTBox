import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { isFirefox, isMobile, isSafari, updateRefHeight } from '../../utils'
import { useTranslation } from 'react-i18next'
import { getUserConfig } from '../../config/index.mjs'

export function InputBox({ onSubmit, enabled, postMessage, reverseResizeDir }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const reverseDivRef = useRef(null)
  const inputRef = useRef(null)
  const resizedRef = useRef(false)
  const [internalReverseResizeDir, setInternalReverseResizeDir] = useState(reverseResizeDir)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    setInternalReverseResizeDir(
      !isSafari() && !isFirefox() && !isMobile() ? internalReverseResizeDir : false,
    )
  }, [])

  const virtualInputRef = internalReverseResizeDir ? reverseDivRef : inputRef

  useEffect(() => {
    inputRef.current.focus()

    const onResizeY = () => {
      if (virtualInputRef.current.h !== virtualInputRef.current.offsetHeight) {
        virtualInputRef.current.h = virtualInputRef.current.offsetHeight
        if (!resizedRef.current) {
          resizedRef.current = true
          virtualInputRef.current.style.maxHeight = ''
        }
      }
    }
    virtualInputRef.current.h = virtualInputRef.current.offsetHeight
    virtualInputRef.current.addEventListener('mousemove', onResizeY)
  }, [])

  useEffect(() => {
    if (!resizedRef.current) {
      if (!internalReverseResizeDir) {
        updateRefHeight(inputRef)
        virtualInputRef.current.h = virtualInputRef.current.offsetHeight
        virtualInputRef.current.style.maxHeight = '160px'
      }
    }
  })

  useEffect(() => {
    if (enabled) {
      getUserConfig().then((config) => {
        if (config.focusAfterAnswer) inputRef.current.focus()
      })
    }
  }, [enabled])

  const handleKeyDownOrClick = (e) => {
    e.stopPropagation()
    if (e.type === 'click' || (e.keyCode === 13 && e.shiftKey === false)) {
      e.preventDefault()
      if (enabled) {
        if (!value) return
        onSubmit(value)
        setValue('')
      } else {
        postMessage({ stop: true })
      }
    }
  }

  const togglePopup = () => {
    setShowPopup(!showPopup)
  }

  return (
    <div className="input-box" style={{ border: 'none', outline: 'none' }}>
      <div
        ref={reverseDivRef}
        style={
          internalReverseResizeDir && {
            transform: 'rotateX(180deg)',
            resize: 'vertical',
            overflow: 'hidden',
            minHeight: '160px',
            position: 'relative',
          }
        }
      >
        <button
          className="dot-button-popup"
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '15px',
            fontSize: '10px',
            padding: '2px 5px',
            backgroundColor: 'goldenrod',
            borderRadius: '5px',
            border: 'none',
            transition: 'transform 0.3s, background-color 0.3s',
          }}
          onMouseEnter={() => {
            togglePopup()
          }}
          onMouseLeave={() => {
            if (showPopup) return
          }}
        >
          Improve
        </button>
        {showPopup && (
          <div
            className="popup"
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              left: '0px',
              backgroundColor: 'white',
              border: 'none',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              zIndex: '999999',
              overflowY: 'auto', // Change overflow to 'auto' for vertical scrollbar
              maxHeight: '200px',
              marginTop: '-105px',
              borderRadius: '6px',
            }}
            onMouseLeave={() => {
              setTimeout(() => {
                setShowPopup(false)
              }, 2000)
            }}
          >
            {[
              {
                tone: 'Casual',
                prompt: `Without changing the language, your task is to rewrite the most recent response to have a casual tone that conveys a sense of informality and friendliness.  Ensure output in the same language variety or dialect of the text - in other words don't change the language ,and only give me the output and nothing else. No fillers. Do not wrap responses in quotes.`,
              },
              {
                tone: 'Straightforward',
                prompt: `Without changing the language, your task is to rewrite the most recent response to have a straightforward tone, make it clear and direct, avoid euphemisms or indirect statements, use simple vocabulary, be honest, and be transparent , with no deceptive or hidden meaning.
                Ensure output in the same language variety or dialect of the text - in other words don't change the language ,and only give me the output and nothing else. No fillers. Do not wrap responses in quotes. `,
              },
              {
                tone: 'Friendly',
                prompt: `Without changing the language, your task to rewrite the most recent response to have a friendly tone, containing pleasant and upbeat vocabulary, as well as positive and encouraging statements. Ensure output in the same language variety or dialect of the text - in other words don't change the language ,and only give me the output and nothing else. No fillers. Do not wrap responses in quotes.`,
              },
              {
                tone: 'Shorter',
                prompt: `Without changing the language, your task is to condense the most recent response while preserving its tone and all essential information. Ensure that the output remains in the same language and retains all important points, but make it shorter. Provide only the condensed version, No fillers. Do not wrap responses in quotes.`,
              },
              {
                tone: 'Longer',
                prompt: `Without altering the language used, your task is to expand upon the most recent response, providing additional details or elaborating on the existing content. Maintain the original tone and ensure that all pertinent information is included. The objective is to create a more comprehensive and detailed version of the original response while adhering to the same language and retaining its essence. Provide the extended version, ensuring that no essential points are omitted and avoiding any unnecessary fillers or alterations. Do not wrap responses in quotes.`,
              },
              {
                tone: 'Rephrase',
                prompt: `Without changing the programming language, your task is to provide a more time or space complexity efficient solution to the most recent response of a coding question. Explain the differences in the new approach compared to the previous one, and include the new time complexity at the end. Ensure the solution is tested, clear, well-commented, and directly addresses the optimization.`,
              },
              {
                tone: 'Confident',
                prompt: `The recent solution provided for the coding problem seems incorrect. Without changing the programming language, please reconsider all the mentioned conditions and review your trained data to provide a new, correct solution to the coding question. Ensure the new solution is tested, clear, and well-commented. Additionally, try to understand or guess the problem statement in full detail and answer correctly this time.`,
              },
            ].map((option) => (
              <div
                key={option['tone']}
                style={{
                  cursor: 'pointer',
                  padding: '6px 10px',
                  fontSize: '13px',
                  fontFamily: 'Arial, sans-serif',
                  transition: 'transform 0.3s, background-color 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'whitesmoke'
                  e.currentTarget.style.transform = 'scale(1.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                onClick={() => {
                  setValue(option.prompt)
                  setShowPopup(false)

                  onSubmit(option.prompt)
                  setValue('')

                  // Post 1 second scroll to bottom
                  setTimeout(() => {
                    document.querySelector('.markdown-body').scrollTop =
                      document.querySelector('.markdown-body').scrollHeight
                  }, 1000)
                }}
              >
                {option['tone']}
              </div>
            ))}
          </div>
        )}
        <textarea
          dir="auto"
          ref={inputRef}
          disabled={!enabled}
          className="interact-input"
          style={
            internalReverseResizeDir
              ? {
                  transform: 'rotateX(180deg)',
                  resize: 'none',
                  fontSize: '15px',
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.4',
                  marginBottom: '15px',
                }
              : {
                  resize: 'vertical',
                  minHeight: '75px',
                  fontSize: '15px',
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.4',
                  marginBottom: '15px',
                }
          }
          placeholder={
            enabled
              ? t('Type your question here\nEnter to send, shift + Enter to break line')
              : t('Type your question here\nEnter to stop generating\nShift + Enter to break line')
          }
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
          }}
          onKeyDown={handleKeyDownOrClick}
        />
      </div>
      <button
        className="submit-button"
        style={{
          backgroundColor: enabled ? 'goldenrod' : 'lightcoral',
        }}
        onClick={handleKeyDownOrClick}
      >
        {enabled ? t('Ask') : t('Stop')}
      </button>
    </div>
  )
}

InputBox.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  enabled: PropTypes.bool.isRequired,
  reverseResizeDir: PropTypes.bool,
  postMessage: PropTypes.func.isRequired,
}

export default InputBox
