import { memo, useState } from 'react'
import { ChevronDownIcon, XCircleIcon, SyncIcon } from '@primer/octicons-react'
import CopyButton from '../CopyButton'
import ReadButton from '../ReadButton'
import PropTypes from 'prop-types'
import MarkdownRender from '../MarkdownRender/markdown.jsx'
import { useTranslation } from 'react-i18next'
import { isUsingCustomModel } from '../../config/index.mjs'
import { useConfig } from '../../hooks/use-config.mjs'
import { TextareaT } from 'react-bootstrap-icons'
import ReactTooltip from 'react-tooltip'
import { findClosestEditableAncestor } from '../../utils/find-closest-editable-ancestor.js'

function AnswerTitle({ descName, modelName }) {
  const { t } = useTranslation()
  const config = useConfig()

  return (
    <p
      style={{
        whiteSpace: 'nowrap',
        color: 'darkgoldenrod',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 'bold',
        letterSpacing: '0.05em',
        marginTop: 'auto',
        marginBottom: 'auto',
      }}
    >
      {descName && modelName
        ? `${t(descName)}${
            isUsingCustomModel({ modelName }) ? ' (' + config.customModelName + ')' : ''
          }:`
        : t('Loading...')}
    </p>
  )
}

AnswerTitle.propTypes = {
  descName: PropTypes.string,
  modelName: PropTypes.string,
}

export function ConversationItem({ type, content, descName, modelName, onRetry, focusedInput }) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)

  const replaceTextInFocusedInput = async () => {
    if (focusedInput && findClosestEditableAncestor(focusedInput)) {
      const replacementText = focusedInput.tagName != 'INPUT' ? content + '\n' : content

      if (focusedInput.tagName === 'INPUT' || focusedInput.tagName === 'TEXTAREA') {
        const { selectionStart, selectionEnd } = focusedInput
        focusedInput.value =
          focusedInput.value.substring(0, selectionStart) +
          replacementText +
          focusedInput.value.substring(selectionEnd)
        focusedInput.focus()
        const newCursorPos = selectionStart + replacementText.length
        focusedInput.setSelectionRange(newCursorPos, newCursorPos)
      } else {
        focusedInput.innerHTML = `<p>${replacementText}</p>`
        focusedInput.focus()

        // Emit input and change events on updating contenteditable element
        const inputEvent = new Event('input', { bubbles: true })
        focusedInput.dispatchEvent(inputEvent)
        const changeEvent = new Event('change', { bubbles: true })
        focusedInput.dispatchEvent(changeEvent)
      }

      // Assuming there's a UI element to close after replacement
      if (document.querySelector('.chatgptbox-selection-window')) {
        document.querySelector('.chatgptbox-selection-window').remove()
      }
    }
  }

  switch (type) {
    case 'question':
      return (
        <div className={type} dir="auto">
          <div className="gpt-header">
            <p>{t('You')}:</p>
            <div className="gpt-util-group">
              <CopyButton contentFn={() => content.replace(/\n<hr\/>$/, '')} size={16} />
              <ReadButton contentFn={() => content} size={16} />
              {!collapsed ? (
                <span
                  title={t('Collapse')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'darkgoldenrod'
                    e.target.style.transform = 'scale(1.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'black'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  <XCircleIcon size={16} />
                </span>
              ) : (
                <span
                  title={t('Expand')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronDownIcon size={16} />
                </span>
              )}
            </div>
          </div>
          {!collapsed && <MarkdownRender>{content}</MarkdownRender>}
        </div>
      )
    case 'answer':
      return (
        <div className={type} dir="auto">
          <div className="gpt-header">
            <div
              className="answer_operations"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignContent: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <AnswerTitle descName={descName} modelName={modelName} />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '20px',
                  marginLeft: '45px',
                }}
              >
                {focusedInput && (
                  <span style={{ marginTop: '5px' }}>
                    <TextareaT
                      onClick={replaceTextInFocusedInput}
                      style={{
                        cursor: 'pointer',
                        fontSize: '20px',
                        backgroundColor:
                          focusedInput.tagName === 'INPUT' || focusedInput.tagName === 'TEXTAREA'
                            ? 'initial'
                            : 'red',
                        borderRadius: '5px',
                        transition: 'transform 0.3s ease, color 0.3s ease',
                      }}
                      data-tip={t('Replace Text')}
                      onMouseEnter={(e) => {
                        e.target.style.color = 'darkgoldenrod'
                        e.target.style.transform = 'scale(1.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = 'black'
                        e.target.style.transform = 'scale(1)'
                      }}
                    />
                    <ReactTooltip />
                  </span>
                )}

                {modelName && (
                  <CopyButton contentFn={() => content.replace(/\n<hr\/>$/, '')} size={16} />
                )}

                {onRetry && (
                  <span
                    title={t('Retry')}
                    className="gpt-util-icon"
                    onClick={onRetry}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'darkgoldenrod'
                      e.target.style.transform = 'scale(1.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'black'
                      e.target.style.transform = 'scale(1)'
                    }}
                  >
                    <SyncIcon size={16} />
                  </span>
                )}
              </div>
            </div>
            <div className="gpt-util-group">
              {modelName && <ReadButton contentFn={() => content} size={16} />}
              {!collapsed ? (
                <span
                  title={t('Collapse')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'darkgoldenrod'
                    e.target.style.transform = 'scale(1.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'black'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  <XCircleIcon size={16} />
                </span>
              ) : (
                <span
                  title={t('Expand')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronDownIcon size={16} />
                </span>
              )}
            </div>
          </div>
          {!collapsed && <MarkdownRender>{content}</MarkdownRender>}
        </div>
      )
    case 'error':
      return (
        <div className={type} dir="auto">
          <div className="gpt-header">
            <p>{t('Error')}:</p>
            <div className="gpt-util-group">
              {onRetry && (
                <span
                  title={t('Retry')}
                  className="gpt-util-icon"
                  onClick={onRetry}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'darkgoldenrod'
                    e.target.style.transform = 'scale(1.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'black'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  <SyncIcon size={16} />
                </span>
              )}
              <CopyButton contentFn={() => content.replace(/\n<hr\/>$/, '')} size={16} />
              {!collapsed ? (
                <span
                  title={t('Collapse')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                >
                  <XCircleIcon size={16} />
                </span>
              ) : (
                <span
                  title={t('Expand')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronDownIcon size={16} />
                </span>
              )}
            </div>
          </div>
          {!collapsed && <MarkdownRender>{content}</MarkdownRender>}
        </div>
      )
  }
}

ConversationItem.propTypes = {
  type: PropTypes.oneOf(['question', 'answer', 'error']).isRequired,
  content: PropTypes.string.isRequired,
  descName: PropTypes.string,
  modelName: PropTypes.string,
  onRetry: PropTypes.func,
  focusedInput: PropTypes.object,
}

export default memo(ConversationItem)
