import { cloneElement, useCallback, useEffect, useState } from 'react'
import ConversationCard from '../ConversationCard'
import PropTypes from 'prop-types'
import { config as toolsConfig } from '../../content-script/selection-tools'
import { getClientPosition, isMobile, setElementPositionInViewport } from '../../utils'
import Draggable from 'react-draggable'
import { useClampWindowSize } from '../../hooks/use-clamp-window-size'
import { useTranslation } from 'react-i18next'
import { useConfig } from '../../hooks/use-config.mjs'
import {
  ThreeDots,
  CpuFill,
  ArrowRightCircleFill,
  ReplyAllFill,
  ChatLeftText,
  ChevronBarDown,
  EnvelopeAt,
} from 'react-bootstrap-icons' // Import CpuFill along with ThreeDots
import { Models, PersonalChatGPTBoxConfig } from '../../config/index.mjs'
import ReactTooltip from 'react-tooltip' // Import ReactTooltip
import { CopilotIcon } from '@primer/octicons-react'

function FloatingToolbar(props) {
  const { t } = useTranslation()
  const [session, setSession] = useState(props.session)
  const [selection, setSelection] = useState(props.selection)
  const [includeSelection, setIncludeSelection] = useState(true)
  const [prompt, setPrompt] = useState(props.prompt)
  const [triggered, setTriggered] = useState(props.triggered)
  const [render, setRender] = useState(false)
  const [closeable, setCloseable] = useState(props.closeable)
  const [position, setPosition] = useState(getClientPosition(props.container))
  const [virtualPosition, setVirtualPosition] = useState({ x: 0, y: 0 })
  const [hiddenToolsVisible, setHiddenToolsVisible] = useState(false)
  const [modulePopupVisible, setModulePopupVisible] = useState(false)
  const [askPopupVisible, setAskPopupVisible] = useState(false)
  const [askInputText, setAskInputText] = useState('')
  const [replyOptionsVisible, setReplyOptionsVisible] = useState(false) // State to toggle reply options
  const [hoverTimeout, setHoverTimeout] = useState(null) // State to handle hover timeout
  const [replyContext, setReplyContext] = useState('')
  const [replyType, setReplyType] = useState(null) // 'email' or 'chat'
  const [replyPopupVisible, setReplyPopupVisible] = useState(false)

  const windowSize = useClampWindowSize([750, 1500], [0, Infinity])
  const config = useConfig()

  useEffect(() => {
    setRender(true)
    if (!triggered) {
      props.container.style.position = 'absolute'
      setTimeout(() => {
        const left = Math.min(
          Math.max(0, window.innerWidth - props.container.offsetWidth - 30),
          Math.max(0, position.x),
        )
        props.container.style.left = `${left}px`
      }, 0)
    }
  }, [triggered, props.container, position.x, window.innerWidth])

  useEffect(() => {
    if (isMobile()) {
      const selectionListener = () => {
        const currentSelection = window.getSelection()?.toString()
        if (currentSelection) setSelection(currentSelection)
      }
      document.addEventListener('selectionchange', selectionListener)
      return () => {
        document.removeEventListener('selectionchange', selectionListener)
      }
    }
  }, [])

  useEffect(() => {
    const textArea = document.querySelector('.reply-box-input-popup .chat-box-popup-textarea')
    if (replyPopupVisible && textArea) {
      textArea.focus() // Focus the textarea
    }
  }, [replyPopupVisible])

  useEffect(() => {
    const textArea = document.querySelector('.chatgptbox-ask-input-popup .chat-box-popup-textarea')
    if (askPopupVisible && textArea) {
      textArea.focus() // Focus the textarea
    }
  }, [askPopupVisible])

  if (!render) return <div />

  const toggleAskPopup = () => {
    setAskPopupVisible(!askPopupVisible)

    setHiddenToolsVisible(false) // Ensure the hidden tools are closed when opening the ask popup
    setModulePopupVisible(false) // Ensure the module popup is closed when opening the ask popup
    setReplyOptionsVisible(false) // Ensure the reply options are closed when opening the ask popup
    setReplyPopupVisible(false) // Ensure the reply popup is closed when opening the ask popup
  }

  const toggleAskSelection = () => {
    setIncludeSelection(!includeSelection)
  }

  const toggleModulePopup = () => {
    setModulePopupVisible(!modulePopupVisible)

    setHiddenToolsVisible(false) // Ensure the hidden tools are closed when opening the module popup
    setReplyOptionsVisible(false) // Ensure the reply options are closed when opening the module popup
    setAskPopupVisible(false) // Ensure the ask popup is closed when opening the module popup
    setReplyPopupVisible(false) // Ensure the reply popup is closed when opening the module popup
  }

  const handleMouseEnterHiddenTools = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    setHiddenToolsVisible(true)

    if (!replyPopupVisible) {
      setReplyOptionsVisible(false)
    }
    setModulePopupVisible(false)
  }

  const handleMouseLeaveHiddenTools = () => {
    const timeout = setTimeout(() => {
      setHiddenToolsVisible(false)
    }, 2000)
    setHoverTimeout(timeout)
  }

  const toggleReplyOptions = useCallback(() => {
    if (hoverTimeout) clearTimeout(hoverTimeout) // Clear any existing timeout
    setReplyOptionsVisible(true)

    setHiddenToolsVisible(false)
  }, [hoverTimeout])
  const closeReplyOptions = useCallback(() => {
    // Set timeout to delay closing
    const timeout = setTimeout(() => {
      setReplyOptionsVisible(false)
    }, 1000) // Delay by 1000 ms (1 second)
    setHoverTimeout(timeout)
  }, [])

  const handleReplyOptionsHover = useCallback(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }, [hoverTimeout])

  const handleAskInputChange = (e) => {
    setAskInputText(e.target.value)
  }
  const handleReplyContextInputChange = (e) => {
    setReplyContext(e.target.value)
  }

  const handleAskKeyDown = async (event) => {
    if (
      (event.shiftKey && event.key === 'Enter') ||
      (event.ctrlKey && event.key === 'Enter') ||
      (event.metaKey && event.key === 'Enter')
    ) {
      event.stopPropagation()
      event.preventDefault()
      handleAskSendClick()
    }
  }

  const handleReplyContextKeyDown = async (event) => {
    if (
      (event.shiftKey && event.key === 'Enter') ||
      (event.ctrlKey && event.key === 'Enter') ||
      (event.metaKey && event.key === 'Enter')
    ) {
      event.stopPropagation()
      event.preventDefault()
      executeReply()
    }
  }

  const handleAskSendClick = async () => {
    const p = getClientPosition(props.container)
    props.container.style.position = 'fixed'
    setPosition(p)

    let askPrompt = ''

    if (includeSelection) {
      askPrompt = `Perform the task independently of the preceding discussion and context. Please thoroughly perform the suggested task below on the text. Only give me the output and nothing else. Do not wrap responses in quotes. Respond in the same language (in other words don't change the language).
      - Task to perform: ${askInputText}
      - Context on which to perform the task : ${selection}
      `
    } else {
      askPrompt =
        `Perform the task independently of the preceding discussion and context. Please provide a thorough response to the following question delimited by triple quotes below without enclosing your answers in quotation marks. Use the same language style as the given text. Utilize available online resources and your extensive training data to ensure a well-informed and comprehensive answer: """` +
        askInputText +
        `"""`
    }

    // console.log(askPrompt)

    setPrompt(askPrompt)
    setTriggered(true)
    setAskInputText('')
    setAskPopupVisible(false)
  }

  const handleTextareaHeightChange = (maxHeight) => (event) => {
    const textarea = event.target
    textarea.style.height = 'auto' // Reset the height to recalculate
    textarea.style.height = textarea.scrollHeight + 'px' // Set height based on scroll height
    if (textarea.scrollHeight >= maxHeight) {
      textarea.style.height = `${maxHeight}px` // Cap the height at maxHeight
    }
  }

  const handleModelChange = (modelName) => {
    const newSession = {
      ...session,
      modelName,
      aiName: Models[modelName].desc,
    }
    setSession(newSession)
    setModulePopupVisible(false) // Close the popup after selection
  }

  const handleToolClick = useCallback(
    async (toolConfig) => {
      const p = getClientPosition(props.container)
      props.container.style.position = 'fixed'
      setPosition(p)
      setPrompt(await toolConfig.genPrompt(selection))
      setTriggered(true)
    },
    [selection, props.container],
  )

  const handleReplyAsEmail = () => {
    const p = getClientPosition(props.container)
    props.container.style.position = 'fixed'
    setPosition(p)

    let askPrompt =
      `Perform the task independently of the preceding discussion and context. Act as ${PersonalChatGPTBoxConfig.full_name}, a software engineer. You have received an email, shown below in triple quotes. Please provide a detailed and professional reply to this email. Always reply as if you are ${PersonalChatGPTBoxConfig.first_name}. If a 'Email Reply Context' is provided, incorporate it into your response to ensure accuracy and relevance. If no additional context is provided, base your response solely on the content of the email. 

      \n Extra information about ${PersonalChatGPTBoxConfig.full_name}'s background and context, it's just for reference if needed while replying. But 'Chat Reply Context' if provided will always be more important.
      ${PersonalChatGPTBoxConfig.resume_content} 
      
      \n Instructions : 
      Your response should not be enclosed in quotation marks. Avoid filler or extra text. Match the language style of the received email, reply as if you are ${PersonalChatGPTBoxConfig.first_name} and utilize available online resources and your extensive training data to ensure a professional, well-informed, accurate, and comprehensive email response:

      \n Prompt to Reply :
       """` +
      selection +
      `"""` +
      (replyContext && replyContext.trim().length > 0
        ? `\n Email Reply Context : ${replyContext}`
        : '')

    console.log(askPrompt)

    setPrompt(askPrompt)
    setTriggered(true)
    setReplyOptionsVisible(false)
    setReplyContext('')
  }

  const handleReplyAsChat = () => {
    const p = getClientPosition(props.container)
    props.container.style.position = 'fixed'
    setPosition(p)

    let askPrompt =
      `Perform the task independently of the preceding discussion and context. Act as ${PersonalChatGPTBoxConfig.full_name}, a software engineer. You have been engaging in a conversation as shown below in triple quotes. Please provide a detailed yet concise professional reply to the most recent message in the conversation. Always reply as if you are ${PersonalChatGPTBoxConfig.first_name}. If 'Chat Reply Context' is provided, use this information to better understand the nuances of the conversation and tailor your response accordingly. If no 'Reply Context' is available, base your response solely on the content of the received message. 

      \n Extra information about ${PersonalChatGPTBoxConfig.full_name}'s background and context, it's just for reference if needed while replying. But 'Chat Reply Context' if provided will always be more important.
      ${PersonalChatGPTBoxConfig.resume_content}


      \n Instructions : 
      Your response should not be enclosed in quotation marks and should avoid filler or unnecessary text. Avoid filler or extra text. Do not attempt to respond to each word in the received message. Match the language style of the received message, reply as if you are ${PersonalChatGPTBoxConfig.first_name} and utilize online resources along with your extensive training data to ensure a well-informed, accurate, and comprehensive chat response:

      \n Prompt to Reply :
       """` +
      selection +
      `"""` +
      (replyContext && replyContext.trim().length > 0
        ? `\n Chat Reply Context : ${replyContext}`
        : '') +
      `\n\n 
      `

    console.log(askPrompt)

    setPrompt(askPrompt)
    setTriggered(true)
    setReplyOptionsVisible(false)
    setReplyContext('')
  }

  const openReplyPopup = (type) => {
    setReplyType(type)
    setReplyPopupVisible(true)

    setReplyOptionsVisible(false)
    setHiddenToolsVisible(false)
    setModulePopupVisible(false)
    setAskPopupVisible(false)
  }

  const executeReply = useCallback(() => {
    if (replyType === 'email') {
      handleReplyAsEmail()
    } else if (replyType === 'chat') {
      handleReplyAsChat()
    }
  }, [replyType, handleReplyAsEmail, handleReplyAsChat])

  if (triggered) {
    const updatePosition = useCallback(() => {
      const newPosition = setElementPositionInViewport(props.container, position.x, position.y)
      if (position.x !== newPosition.x || position.y !== newPosition.y) {
        setPosition(newPosition)
      }
    }, [props.container, position])

    const dragEvent = {
      onDrag: (e, ui) => {
        setVirtualPosition({ x: virtualPosition.x + ui.deltaX, y: virtualPosition.y + ui.deltaY })
      },
      onStop: () => {
        setPosition({ x: position.x + virtualPosition.x, y: position.y + virtualPosition.y })
        setVirtualPosition({ x: 0, y: 0 })
      },
    }

    if (virtualPosition.x === 0 && virtualPosition.y === 0) {
      updatePosition()
    }

    const onClose = useCallback(() => {
      props.container.remove()
    }, [props.container])

    const onDock = useCallback(() => {
      props.container.className = 'chatgptbox-toolbar-container-not-queryable'
      setCloseable(true)
    }, [props.container])

    const onUpdate = useCallback(() => {
      updatePosition()
    }, [position])

    if (config.alwaysPinWindow) onDock()

    return (
      <div data-theme={config.themeMode}>
        <Draggable
          handle=".draggable"
          onDrag={dragEvent.onDrag}
          onStop={dragEvent.onStop}
          position={virtualPosition}
        >
          <div
            className="chatgptbox-selection-window"
            style={{ width: `${windowSize[0] * 0.4}px` }}
          >
            <div className="chatgptbox-container">
              <ConversationCard
                session={session}
                question={prompt}
                draggable={true}
                closeable={closeable}
                onClose={onClose}
                dockable={props.dockable}
                onUpdate={onUpdate}
                focusedInput={props.focusedInput}
              />
            </div>
          </div>
        </Draggable>
      </div>
    )
  } else {
    if (config.activeSelectionTools.length === 0) return <div />

    const tools = []
    const maxVisibleTools = 3 // Maximum number of visible tools

    for (const key in toolsConfig) {
      if (config.activeSelectionTools.includes(key)) {
        const toolConfig = toolsConfig[key]
        tools.push({
          icon: cloneElement(toolConfig.icon, {
            size: 24,
            title: t(toolConfig.label),
          }),
          label: t(toolConfig.label),
          onClick: () => handleToolClick(toolConfig),
        })
      }
    }

    // Slice tools array to show only the first 4 tools
    const visibleTools = tools.slice(0, maxVisibleTools)
    const hiddenTools = tools.slice(maxVisibleTools) // Tools to be hidden initially

    const dragEvent = {
      onDrag: (e, ui) => {
        setVirtualPosition({ x: virtualPosition.x + ui.deltaX, y: virtualPosition.y + ui.deltaY })
      },
      onStop: () => {
        setPosition({ x: position.x + virtualPosition.x, y: position.y + virtualPosition.y })
        // setVirtualPosition({ x: 0, y: 0 })
      },
    }

    return (
      <Draggable
        handle=".drag-handle"
        position={virtualPosition}
        onDrag={dragEvent.onDrag}
        onStop={dragEvent.onStop}
      >
        <div data-theme={config.themeMode}>
          <div className="chatgptbox-selection-toolbar">
            <div className="chatgptbox-selection-toolbar-button" onClick={toggleModulePopup}>
              <CpuFill
                size={22}
                style={{
                  marginLeft: '4px',
                  marginRight: '3px',
                  color: 'goldenrod',
                  transition: 'color 0.2s ease', // Add transition for color change
                }}
                onMouseEnter={(e) => (e.target.style.color = 'darkgoldenrod')} // Change color on hover
                onMouseLeave={(e) => (e.target.style.color = 'goldenrod')} // Revert color on hover out
              />{' '}
              {/* CpuFill icon for model selection */}
            </div>
            <div
              className="chatgptbox-selection-toolbar-button"
              style={{ height: '100%', marginRight: '3px', marginLeft: '5px' }}
              onClick={toggleAskPopup}
            >
              <CopilotIcon
                size={19}
                style={{
                  paddingLeft: '6px',
                  paddingRight: '6px',
                }}
              />
            </div>
            {askPopupVisible && (
              <div className="chatgptbox-ask-input-popup">
                <div
                  className="selected-text-display"
                  onClick={toggleAskSelection}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`text-content ${includeSelection ? '' : 'text-dim'}`}>
                    {selection}
                  </span>
                  <input
                    type="checkbox"
                    className="include-checkbox"
                    checked={includeSelection}
                    onChange={toggleAskSelection} // This now becomes redundant for clicks but is needed for keyboard accessibility
                    style={{ pointerEvents: 'none' }} // Disables direct interaction with the checkbox, forcing use of the div's onClick
                  />
                </div>
                <hr className="divider" />
                <div className="input-with-icon">
                  <textarea
                    value={askInputText}
                    onChange={handleAskInputChange}
                    onInput={handleTextareaHeightChange(200)}
                    onKeyDown={handleAskKeyDown}
                    className="chat-box-popup-textarea"
                    placeholder="Type your question here..."
                  />
                  <ArrowRightCircleFill
                    size={26}
                    onClick={handleAskSendClick}
                    className="send-icon"
                  />
                </div>
              </div>
            )}
            {/* ReplyAllFill Button */}
            <div
              className="chatgptbox-selection-toolbar-button"
              onMouseEnter={toggleReplyOptions}
              onMouseLeave={closeReplyOptions}
              onClick={() => {
                setReplyOptionsVisible(!replyOptionsVisible)
                setReplyPopupVisible(false)
              }}
            >
              <ReplyAllFill size={20} style={{ marginLeft: '5px', marginRight: '5px' }} />
            </div>
            {visibleTools.map((tool, index) => (
              <div
                key={index}
                className="chatgptbox-selection-toolbar-button"
                onClick={tool.onClick}
                data-tip={tool.label} // Set the tooltip text
                data-for={`toolTooltip-${index}`} // Set a unique tooltip ID for each tool
              >
                {tool.icon}
                <ReactTooltip
                  id={`toolTooltip-${index}`}
                  place="bottom"
                  type="dark"
                  effect="solid"
                />{' '}
                {/* Define the tooltip */}
              </div>
            ))}
            {/* Conditional Rendering of Reply Options */}
            {(replyOptionsVisible || replyPopupVisible) && (
              <div
                onMouseEnter={handleReplyOptionsHover}
                onMouseLeave={closeReplyOptions}
                style={{ position: 'absolute', top: '-35px', left: '55px', display: 'flex' }}
              >
                <div
                  className="chatgptbox-selection-toolbar-button"
                  onClick={() => openReplyPopup('chat')}
                  style={{
                    backgroundColor: 'white',
                    padding: '5px',
                    borderRadius: '5px',
                  }}
                >
                  <ChatLeftText size={22} />
                </div>
                <div
                  className="chatgptbox-selection-toolbar-button"
                  onClick={() => openReplyPopup('email')}
                  style={{
                    backgroundColor: 'white',
                    padding: '5px',
                    borderRadius: '5px',
                    marginLeft: '4px',
                  }}
                >
                  <EnvelopeAt size={22} />
                </div>
              </div>
            )}
            {replyPopupVisible && (
              <div
                className="reply-box-input-popup input-with-icon"
                style={{
                  position: 'absolute',
                  top: '-175px',
                  width: '400px',
                  right: '-60px',
                  left: 'auto',
                  backgroundColor: 'white',
                  padding: '5px',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: '1px solid #ccc',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div
                  style={{
                    margin: '0px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  Reply as {replyType === 'email' ? 'Email' : 'Chat'}
                </div>
                <hr className="divider" style={{ width: '100%' }} />
                <div style={{ display: 'flex', width: '100%' }}>
                  <textarea
                    value={replyContext}
                    onChange={handleReplyContextInputChange}
                    onInput={handleTextareaHeightChange(300)}
                    onKeyDown={handleReplyContextKeyDown}
                    className="chat-box-popup-textarea"
                    placeholder="Add your reply context..."
                    style={{ flex: 1, marginRight: '5px' }} // Adjust size and margin between textarea and button
                  />
                  <ArrowRightCircleFill
                    size={26}
                    onClick={executeReply}
                    className="send-icon"
                    style={{ cursor: 'pointer', alignSelf: 'center', marginLeft: '0px' }} // Adjust alignment to match textarea
                  />
                </div>
              </div>
            )}

            <div
              className="chatgptbox-selection-toolbar-button"
              style={{ height: '100%' }}
              onMouseEnter={handleMouseEnterHiddenTools}
              onMouseLeave={handleMouseLeaveHiddenTools}
            >
              <ThreeDots
                size={22}
                style={{
                  marginLeft: '4px',
                  marginRight: '3px',
                  color: 'goldenrod',
                  transition: 'color 0.2s ease', // Add transition for color change
                }}
                onMouseEnter={(e) => (e.target.style.color = 'darkgoldenrod')} // Change color on hover
                onMouseLeave={(e) => (e.target.style.color = 'goldenrod')} // Revert color on hover out
              />
              {hiddenToolsVisible && (
                <div className="chatgptbox-selection-toolbar-hidden-tools">
                  {hiddenTools.map((tool, index) => (
                    <div
                      key={index}
                      className="chatgptbox-selection-toolbar-button"
                      onClick={tool.onClick}
                    >
                      {tool.icon}
                      <span className="tool-label">{tool.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Draggable handle bar */}
          <div
            className="drag-handle"
            style={{
              cursor: 'move',
              height: '16px',
              borderRadius: '2px',
              position: 'absolute',
              left: '50%',
              bottom: '-15px',
              transform: 'translateX(-50%)',
              width: '30px',
              textAlign: 'center',
              zIndex: 1000,
            }}
          >
            <ChevronBarDown size={22} />
          </div>

          {modulePopupVisible && (
            <div className="chatgptbox-model-selection-popup">
              {config.activeApiModes.map((modelName) => {
                let desc = modelName
                if (modelName in Models) {
                  desc = `${t(Models[modelName].desc)}`
                }
                return (
                  <div
                    key={modelName}
                    className="chatgptbox-model-selection-popup-item"
                    onClick={() => handleModelChange(modelName)}
                  >
                    {desc}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Draggable>
    )
  }
}

FloatingToolbar.propTypes = {
  session: PropTypes.shape({
    modelName: PropTypes.string.isRequired,
    aiName: PropTypes.string,
  }).isRequired,
  selection: PropTypes.string.isRequired,
  container: PropTypes.object.isRequired,
  triggered: PropTypes.bool,
  closeable: PropTypes.bool,
  dockable: PropTypes.bool,
  prompt: PropTypes.string,
  focusedInput: PropTypes.object,
}

export default FloatingToolbar
