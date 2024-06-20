import { cloneElement, useCallback, useEffect, useState } from 'react'
import ConversationCard from '../ConversationCard'
import PropTypes from 'prop-types'
import { config as toolsConfig } from '../../content-script/selection-tools'
import { getClientPosition, isMobile } from '../../utils'
import Draggable from 'react-draggable'
import { useClampWindowSize } from '../../hooks/use-clamp-window-size'
import { useTranslation } from 'react-i18next'
import { useConfig } from '../../hooks/use-config.mjs'
import {
  ThreeDots,
  CpuFill,
  ArrowRightCircleFill,
  ReplyAllFill,
  ChevronBarDown,
  EnvelopeAt,
  ChatQuote,
  ChatSquareDotsFill,
  Trash,
} from 'react-bootstrap-icons' // Import CpuFill along with ThreeDots
import { Models, PersonalChatGPTBoxConfig } from '../../config/index.mjs'
import ReactTooltip from 'react-tooltip' // Import ReactTooltip
import { CopilotIcon } from '@primer/octicons-react'
import { ensureFloatingToolbarVisibilityInsideScreen } from '../../utils/ensure-floating-toolbar-visibility-inside-screen'
import { Resizable } from 're-resizable'
import { ShowTemplatesPopup, AddNewTemplatePopup } from './TemplatePopup'

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
  const [templateMessages, setTemplateMessages] = useState([])
  const [templatePopupVisible, setTemplatePopupVisible] = useState(false)
  const [addNewTemplatePopupVisible, setAddNewTemplatePopupVisible] = useState(false)

  let widthFactorOfScreen = 0.45

  const windowSize = useClampWindowSize([750, 1500], [0, Infinity])
  const config = useConfig()

  const [currentWidth, setCurrentWidth] = useState(windowSize[0] * widthFactorOfScreen) // initial width

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

  useEffect(() => {
    // Initialize template messages from chrome.storage when the component mounts
    // eslint-disable-next-line no-undef
    chrome.storage.local.get('PersonalChatGPTBoxConfig_templateMessages', function (result) {
      if (result.PersonalChatGPTBoxConfig_templateMessages) {
        setTemplateMessages(result.PersonalChatGPTBoxConfig_templateMessages)
      }
    })
  }, [])

  useEffect(async () => {
    // This effect runs when the templatePopupVisible state changes
    const loadTemplateMessages = async () => {
      // eslint-disable-next-line no-undef
      await chrome.storage.local.get(
        'PersonalChatGPTBoxConfig_templateMessages',
        function (result) {
          if (result.PersonalChatGPTBoxConfig_templateMessages) {
            setTemplateMessages(result.PersonalChatGPTBoxConfig_templateMessages)
          }
        },
      )
    }

    if (templatePopupVisible) {
      await loadTemplateMessages()
    }

    if (templatePopupVisible && document.querySelector('.chatgptbox-selection-toolbar')) {
      document.querySelector('.chatgptbox-selection-toolbar').style.display = 'none'
    } else if (document.querySelector('.chatgptbox-selection-toolbar')) {
      document.querySelector('.chatgptbox-selection-toolbar').style.display = 'revert-layer'
    }

    if (templatePopupVisible && document.querySelector('.drag-handle')) {
      document.querySelector('.drag-handle').style.display = 'none'
    } else if (document.querySelector('.drag-handle')) {
      document.querySelector('.drag-handle').style.display = 'block'
    }
  }, [templatePopupVisible])
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

  const setPosition_ForChatPopUp = (props) => {
    let p = getClientPosition(props.container, true)
    p.x -= 250
    p.y -= 100
    p = ensureFloatingToolbarVisibilityInsideScreen(p, props.container)

    props.container.style.position = 'absolute'
    props.container.style.left = `${p.x}px`
    props.container.style.top = `${p.y}px`
    setPosition(p)
  }

  const handleAskSendClick = useCallback(async () => {
    setPosition_ForChatPopUp(props)

    let askPrompt = includeSelection
      ? `Perform the task independently of the preceding discussion and context. Please thoroughly perform the suggested task below on the text. Only give me the output and nothing else. Do not wrap responses in quotes. Respond in the same language (in other words don't change the language).
        - Task to perform: ${askInputText}
        - Context on which to perform the task: ${selection}`
      : `Perform the task independently of the preceding discussion and context. Please provide a thorough response to the following question delimited by triple quotes below without enclosing your answers in quotation marks. Use the same language style as the given text. Utilize available online resources and your extensive training data to ensure a well-informed and comprehensive answer: "${askInputText}"`

    console.log(askPrompt)

    if (includeSelection) {
      navigator.clipboard.writeText(askInputText)
    }

    setPrompt(askPrompt)
    setTriggered(true)
    setAskInputText('')
    setAskPopupVisible(false)
  }, [props.container, includeSelection, askInputText, selection]) // Dependencies

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
      p.x = p.x - 200

      props.container.style.position = 'fixed'
      setPosition(p)
      setPrompt(await toolConfig.genPrompt(selection))
      setTriggered(true)
    },
    [selection, props.container],
  )

  const handleReplyAsEmail = useCallback(() => {
    setPosition_ForChatPopUp(props)

    let askPrompt =
      `Perform the task independently of the preceding discussion and context. Act as ${PersonalChatGPTBoxConfig.full_name}, a software engineer. You have received an email, shown below in triple quotes. Please provide a detailed and professional reply to this email. Always reply as if you are ${PersonalChatGPTBoxConfig.first_name}. If a 'Reply Context' is provided, incorporate it into your response to ensure accuracy and relevance. If no additional context is provided, base your response solely on the content of the email. 
  
    \n Extra information about ${PersonalChatGPTBoxConfig.full_name}'s background and context is just for reference if needed while replying. However, 'Reply Context' if provided, will always be more important.
    ${PersonalChatGPTBoxConfig.resume_content}
  
    \n Instructions:
    Your response should not be enclosed in quotation marks. Avoid filler or extra text. Match the language style of the received email. Reply as if you are ${PersonalChatGPTBoxConfig.first_name} and utilize available online resources and your extensive training data to ensure a professional, well-informed, accurate, and comprehensive email response. 
  
    \n Received Email Message:
    """` +
      selection +
      `"""` +
      (replyContext && replyContext.trim().length > 0
        ? `\n Important Reply Context for my reply to the above received Email: "${replyContext}"`
        : '')

    if (replyContext && replyContext.trim().length > 0) {
      navigator.clipboard.writeText(replyContext)
    }

    console.log(askPrompt)

    setPrompt(askPrompt)
    setTriggered(true)
    setReplyOptionsVisible(false)
    setReplyContext('')
  }, [props.container, selection, replyContext]) // Include all relevant dependencies

  const handleReplyAsChat = useCallback(() => {
    setPosition_ForChatPopUp(props)

    let askPrompt =
      `Perform the task independently of the preceding discussion and context. Act as ${PersonalChatGPTBoxConfig.full_name}, a software engineer. You have been engaging in a conversation as shown below in triple quotes. Please provide a detailed yet concise professional reply to the most recent message in the conversation. Always reply as if you are ${PersonalChatGPTBoxConfig.first_name}. If 'Reply Context' is provided, use this information to better understand the nuances of the conversation and tailor your response accordingly. If no 'Reply Context' is available, base your response solely on the content of the received message. 
  
    \n Extra information about ${PersonalChatGPTBoxConfig.full_name}'s background and context is just for reference if needed while replying. However, 'Reply Context' if provided, will always be more important.
    ${PersonalChatGPTBoxConfig.resume_content}
  
    \n Instructions:
    Your response should not be enclosed in quotation marks and should avoid filler or unnecessary text. Do not attempt to respond to each word in the received message. Match the language style of the received message. Reply as if you are ${PersonalChatGPTBoxConfig.first_name} and utilize online resources along with your extensive training data to ensure a well-informed, accurate, and comprehensive chat response.
  
    \n Received Chat Message:
    """` +
      selection +
      `"""` +
      (replyContext && replyContext.trim().length > 0
        ? `\n Important Reply Context for my reply to the above received Message: "${replyContext}"`
        : '') +
      `\n\n 
    `

    if (replyContext && replyContext.trim().length > 0) {
      navigator.clipboard.writeText(replyContext)
    }

    console.log(askPrompt)

    setPrompt(askPrompt)
    setTriggered(true)
    setReplyOptionsVisible(false)
    setReplyContext('')
  }, [props.container, selection, replyContext]) // Add all variables that the function depends on

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

  const handleDeleteTemplate = (index) => {
    const updatedMessages = [...templateMessages]
    updatedMessages.splice(index, 1)

    // eslint-disable-next-line no-undef
    chrome.storage.local.set(
      {
        PersonalChatGPTBoxConfig_templateMessages: updatedMessages,
      },
      () => {
        setTemplateMessages(updatedMessages)
      },
    )
  }

  const handleAddNewTemplate = () => {
    let newPlaceholder = document.getElementById('placeholders_AddNewTemplatePopup').value.trim()
    let newMessage = document.getElementById('message_AddNewTemplatePopup').value.trim()

    const newTemplate = { message: newMessage, placeholder: newPlaceholder }
    const updatedMessages = [...templateMessages, newTemplate]

    // eslint-disable-next-line no-undef
    chrome.storage.local.set(
      {
        PersonalChatGPTBoxConfig_templateMessages: updatedMessages,
      },
      () => {
        setTemplateMessages(updatedMessages)
        setAddNewTemplatePopupVisible(false)
      },
    )
  }

  const handleTemplateMessage_ToCustomize = useCallback((template) => {
    navigator.clipboard.writeText(template.message)

    setTemplatePopupVisible(false)

    if (template.placeholder.trim().length <= 0) {
      if (document.querySelector('.chatgptbox-toolbar-container')) {
        document.querySelector('.chatgptbox-toolbar-container').remove()
      }
      return
    }

    setPosition_ForChatPopUp(props)

    let prompt = `Act as a proficient writer, always acting as if your name is Niraj and you are a Software Engineer with a Masters in Computer Science from the University of Southern California. Your task is to accurately identify and substitute placeholders in a text with relevant information from provided context. Maintain the original sentence flow and structure while replacing placeholders. If a specific value for a placeholder is not available within the context, leave the placeholder unchanged.

Functionality:
Input: Receive text containing placeholders formatted as <<placeholder>>, along with a section providing context.
Processing: Analyze the context to match placeholders with the relevant information.
Output: Generate text where all placeholders have been replaced with the corresponding context information. If no information is available for a placeholder, it remains unchanged.

Instructions:
Input Analysis: Parse the input to separate the text with placeholders from the context.
Information Retrieval: Analyze the context to identify possible values for each placeholder, extracting relevant data.
Text Replacement: Substitute each placeholder in the text with the identified value from the context, ensuring the grammatical structure and original flow are preserved.
Handling Missing Data: If no appropriate value is found for a placeholder, leave it unchanged.
Output the Modified Text: The final output should be the text with placeholders replaced, adhering to the original style and structure of the message. Just give updated text; don't give any filler or extra explanation; just give updated text.

Example:
Input Message: "Dear <<Name>>, my interview appointment is scheduled for the <<Position>> role on <<Date>> at <<Time>>. I will carry the <<Document>> for the interview. Thanks."
Context: "Hi Niraj, I am scheduling your interview for the Software Engineer role at Infosys. The meeting is scheduled for June 24th. Our company needs you to bring your Passport. Your interviewer will be John Doe. Regards, Peter."
Output: "Dear John Doe, my interview appointment is scheduled for the Software Engineer role on June 24th at <<Time>>. I will carry the Passport for the interview. Thanks."
In this example, the <<Time>> placeholder remains unchanged as no relevant data could be retrieved from the context.

Attempt to replace following placeholders: ${template.placeholder}

Input Message Text to Update: ${template.message}

Context for Updating above data: ${selection}

Output: Just give updated text; don't give any filler or extra explanation; just give updated text. `

    console.log(prompt)

    setPrompt(prompt)
    setTriggered(true)
  }, [])

  if (triggered) {
    // console.log('Initial Box ', position, windowSize, virtualPosition)
    const updatePosition = useCallback(() => {
      // const newPosition = setElementPositionInViewport(props.container, position.x, position.y)
      const newPosition = ensureFloatingToolbarVisibilityInsideScreen(position, props.container)
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
        // setVirtualPosition({ x: 0, y: 0 })
      },
    }

    if (virtualPosition.x === 0 && virtualPosition.y === 0) {
      updatePosition()
    }

    const onClose = useCallback(() => {
      props.container.remove()
    }, [props.container])

    const onDock = useCallback(() => {
      props.container.className = 'chatgptbox-toolbar-container-docked'
      setCloseable(true)
    }, [props.container])

    const onUpdate = useCallback(() => {
      updatePosition()
    }, [position])

    if (config.alwaysPinWindow) onDock()

    // console.log('Final Box : ', position, windowSize, virtualPosition)
    // console.log('\n\n')
    return (
      <div data-theme={config.themeMode}>
        <Draggable
          handle=".draggable"
          onDrag={dragEvent.onDrag}
          onStop={dragEvent.onStop}
          position={virtualPosition}
        >
          <Resizable
            minWidth={`${windowSize[0] * widthFactorOfScreen}px`}
            onResize={(event, direction, ref) => {
              setCurrentWidth(ref.style.width)
            }}
            onResizeStop={(event, direction, ref) => {
              setCurrentWidth(ref.style.width) // update currentWidth to the new width after resizing
            }}
            enable={{
              top: false,
              right: true,
              bottom: false,
              left: true,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false,
            }}
          >
            <div
              className="chatgptbox-selection-window"
              style={{
                width: currentWidth,
                minWidth: `${windowSize[0] * widthFactorOfScreen}px`,
              }}
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
          </Resizable>
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

    const updatePosition = useCallback(() => {
      // const newPosition = setElementPositionInViewport(props.container, position.x, position.y)
      const newPosition = ensureFloatingToolbarVisibilityInsideScreen(position)
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
        // setVirtualPosition({ x: 0, y: 0 })
      },
    }

    if (virtualPosition.x === 0 && virtualPosition.y === 0) {
      updatePosition()
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
                  transition: 'transform 0.3s ease, color 0.2s ease', // Add transition for color change
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'darkgoldenrod'
                  e.target.style.transform = 'scale(1.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'goldenrod'
                  e.target.style.transform = 'scale(1)'
                }}
              />{' '}
            </div>
            <div
              className="chatgptbox-selection-toolbar-button"
              style={{
                padding: '0px 6px',
                transition: 'transform 0.3s ease, color 0.2s ease',
              }}
              onClick={toggleAskPopup}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
              }}
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
                    style={{ transition: 'transform 0.3s ease, color 0.2s ease' }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)'
                    }}
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
              <ReplyAllFill
                size={20}
                style={{
                  marginLeft: '5px',
                  marginRight: '5px',
                  transition: 'transform 0.3s ease, color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)'
                }}
              />
            </div>
            {visibleTools.map((tool, index) => (
              <div
                key={index}
                className="chatgptbox-selection-toolbar-button"
                onClick={tool.onClick}
                data-tip={tool.label} // Set the tooltip text
                data-for={`toolTooltip-${index}`} // Set a unique tooltip ID for each tool
                style={{ transition: 'transform 0.3s ease, color 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)'
                }}
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
                    height: '25px !important',
                    transition: 'transform 0.3s ease, color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  <ChatQuote size={22} />
                </div>
                <div
                  className="chatgptbox-selection-toolbar-button"
                  onClick={() => openReplyPopup('email')}
                  style={{
                    backgroundColor: 'white',
                    padding: '5px',
                    borderRadius: '5px',
                    marginLeft: '4px',
                    height: '25px !important',
                    transition: 'transform 0.3s ease, color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
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
                    style={{
                      cursor: 'pointer',
                      alignSelf: 'center',
                      marginLeft: '0px',
                      transition: 'transform 0.3s ease, color 0.2s ease',
                    }} // Adjust alignment to match textarea
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Niraj Chaudhari user : Show Common Messages for sending */}
            {PersonalChatGPTBoxConfig.full_name == 'Niraj Chaudhari' && (
              <div
                className="chatgptbox-selection-toolbar-button"
                data-tip={'Templates'} // Set the tooltip text
                data-for={`toolTooltip-template`} // Set a unique tooltip ID for each tool
                style={{ transition: 'transform 0.3s ease, color 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)'
                }}
                onClick={() => {
                  setTemplatePopupVisible(!templatePopupVisible)
                }}
              >
                <ChatSquareDotsFill
                  size={17}
                  style={{
                    marginLeft: '5px',
                    marginRight: '5px',
                    transition: 'transform 0.3s ease, color 0.2s ease',
                  }}
                />
                <ReactTooltip
                  id={`toolTooltip-template`}
                  place="bottom"
                  type="dark"
                  effect="solid"
                />{' '}
                {/* Define the tooltip */}
              </div>
            )}

            {templatePopupVisible && (
              <ShowTemplatesPopup visible={templatePopupVisible}>
                <button
                  onClick={() => setTemplatePopupVisible(false)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'transparent',
                    color: 'black',
                    padding: '5px 10px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.3s ease, transform 0.3s ease',
                    fontSize: '20px',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  &#10005; {/* Unicode character for "X" symbol */}
                </button>
                <br />
                <br />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row', // Maintain row direction for horizontal layout
                    flexWrap: 'wrap', // Ensure items can wrap to next line
                    overflowY: 'auto', // Enable vertical scrolling within container
                    padding: '20px 10px 20px 20px', // Padding around the edges
                    alignItems: 'center', // Vertically center the child elements
                  }}
                >
                  {templateMessages.length > 0 ? (
                    templateMessages.map((template, index) => (
                      <div
                        key={index}
                        style={{
                          marginBottom: '20px',
                          marginRight: '20px', // Spacing between items
                          padding: '10px',
                          border: '1px solid #ccc',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          flexBasis: 'calc(50% - 20px)', // Adjust width for wrapping
                          flexGrow: '1', // Allow items to grow to fill space
                          minWidth: '150px', // Minimum width
                          textAlign: 'center', // Center text
                          position: 'relative', // Needed for absolute positioning of children
                          transition: 'transform 0.3s ease, color 0.2s ease',
                        }}
                        onClick={() => handleTemplateMessage_ToCustomize(template)}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgb(220 219 219)'
                          e.target.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#f0f0f0'
                          e.target.style.transform = 'scale(1)'
                        }}
                      >
                        <div>{template.placeholder}</div>
                        <div style={{ fontSize: '12px', color: 'grey' }}>{template.message}</div>
                        <br />
                        <div
                          style={{
                            transition: 'transform 0.3s ease, color 0.2s ease',
                            width: 'fit-content',
                            margin: 'auto',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = 'goldenrod'
                            e.target.style.transform = 'scale(1.2)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = 'black'
                            e.target.style.transform = 'scale(1)'
                          }}
                        >
                          <Trash
                            size={20}
                            style={{
                              cursor: 'pointer',
                            }}
                            onClick={(event) => {
                              event.stopPropagation() // Prevent event bubbling
                              handleDeleteTemplate(index)
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <h3 style={{ textAlign: 'center', margin: 'auto', fontSize: '20px' }}>
                      No Template Messages Saved
                    </h3>
                  )}
                </div>

                <button
                  onClick={() => {
                    setAddNewTemplatePopupVisible(true)
                  }}
                  style={{
                    display: 'block', // Change display to block for centering
                    margin: '20px auto', // Auto margins for horizontal centering
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    backgroundColor: 'goldenrod',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    transition: 'transform 0.3s ease, color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'darkgoldenrod'
                    e.target.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'goldenrod'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  Add New Message
                </button>
              </ShowTemplatesPopup>
            )}

            {addNewTemplatePopupVisible && (
              <AddNewTemplatePopup visible={addNewTemplatePopupVisible}>
                <button
                  onClick={() => setAddNewTemplatePopupVisible(false)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'transparent',
                    color: 'black',
                    padding: '5px 10px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.3s ease, transform 0.3s ease',
                    fontSize: '20px',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  &#10005; {/* Unicode character for "X" symbol */}
                </button>

                <h4 style={{ textAlign: 'center', fontSize: '20px' }}>Add New Template</h4>

                <label
                  htmlFor="placeholders_AddNewTemplatePopup"
                  style={{ fontSize: '15px', fontWeight: 'bold' }}
                >
                  Placeholders :
                </label>
                <textarea
                  id="placeholders_AddNewTemplatePopup"
                  style={{
                    display: 'block',
                    width: '95%',
                    height: '60px',
                    marginBottom: '10px',
                    padding: '10px',
                    borderRadius: '4px',
                  }}
                  className="template-popup-textarea"
                  placeholder="Placeholders like <<PERSON>>, <<POSITION>>, <<COMPANY>> etc."
                />

                <br />
                <label
                  htmlFor="message_AddNewTemplatePopup"
                  style={{ fontSize: '15px', fontWeight: 'bold' }}
                >
                  Message :
                </label>
                <textarea
                  id="message_AddNewTemplatePopup"
                  style={{
                    display: 'block',
                    width: '95%',
                    height: '120px',
                    marginBottom: '20px',
                    padding: '10px',
                    borderRadius: '4px',
                  }}
                  className="template-popup-textarea"
                  placeholder='Message like "Hello <<PERSON>>, I am interested in the <<POSITION>> position at <<COMPANY>>. Please let me know if you have any questions."'
                />

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={handleAddNewTemplate}
                    style={{
                      backgroundColor: 'goldenrod',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease, background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)'
                      e.target.style.backgroundColor = 'darkgoldenrod'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)'
                      e.target.style.backgroundColor = 'goldenrod'
                    }}
                  >
                    Add Template
                  </button>
                </div>
              </AddNewTemplatePopup>
            )}

            <div
              className="chatgptbox-selection-toolbar-button"
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
                      style={{ transition: 'transform 0.3s ease, color 0.2s ease' }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)'
                      }}
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
              left: '43%',
              bottom: '-15px',
              width: '30px',
              textAlign: 'center',
              zIndex: 1000,
              transition: 'transform 0.3s ease, color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.2)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
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
                    style={{ transition: 'transform 0.3s ease, color 0.2s ease' }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)'
                    }}
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
