import { cloneElement, useCallback, useEffect, useState } from 'react'
import ConversationCard from '../ConversationCard'
import PropTypes from 'prop-types'
import { config as toolsConfig } from '../../content-script/selection-tools'
import { getClientPosition, isMobile, setElementPositionInViewport } from '../../utils'
import Draggable from 'react-draggable'
import { useClampWindowSize } from '../../hooks/use-clamp-window-size'
import { useTranslation } from 'react-i18next'
import { useConfig } from '../../hooks/use-config.mjs'
import { ThreeDots, CpuFill, ArrowRightCircleFill, QuestionCircle } from 'react-bootstrap-icons' // Import CpuFill along with ThreeDots
import { Models } from '../../config/index.mjs'
import ReactTooltip from 'react-tooltip' // Import ReactTooltip

function FloatingToolbar(props) {
  const { t } = useTranslation()
  const [session, setSession] = useState(props.session)
  const [selection, setSelection] = useState(props.selection)
  const [prompt, setPrompt] = useState(props.prompt)
  const [triggered, setTriggered] = useState(props.triggered)
  const [render, setRender] = useState(false)
  const [closeable, setCloseable] = useState(props.closeable)
  const [position, setPosition] = useState(getClientPosition(props.container))
  const [virtualPosition, setVirtualPosition] = useState({ x: 0, y: 0 })
  const [hiddenToolsVisible, setHiddenToolsVisible] = useState(false)
  const [modulePopupVisible, setModulePopupVisible] = useState(false) // New state for module popup visibility
  const [askPopupVisible, setAskPopupVisible] = useState(false)
  const [inputText, setInputText] = useState('')
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

  if (!render) return <div />

  const toggleAskPopup = () => {
    setAskPopupVisible(!askPopupVisible)
  }

  const handleAskInputChange = (e) => {
    setInputText(e.target.value)
  }
  const handleAskKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault() // Prevents the default action of the enter key
      handleAskSendClick()
    }
  }
  const handleAskSendClick = async () => {
    const p = getClientPosition(props.container)
    props.container.style.position = 'fixed'
    setPosition(p)
    setPrompt(await toolsConfig.ask.genPrompt(inputText + '&*&' + selection))
    console.log(inputText + '&*&' + selection)
    setTriggered(true)
    setAskPopupVisible(false)
  }

  const toggleModulePopup = () => {
    setModulePopupVisible(!modulePopupVisible)
    setHiddenToolsVisible(false) // Ensure the hidden tools are closed when opening the module popup
  }

  // Toggle visibility of hidden tools
  const toggleHiddenTools = () => {
    setHiddenToolsVisible(!hiddenToolsVisible)
    setModulePopupVisible(false) // Ensure the module popup is closed when opening the hidden tools
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
    const maxVisibleTools = 5 // Maximum number of visible tools

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

    return (
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
          <div className="chatgptbox-selection-toolbar-button" onClick={toggleAskPopup}>
            <QuestionCircle
              size={18}
              style={{
                marginLeft: '4px',
                marginRight: '3px',
              }}
            />
          </div>
          {askPopupVisible && (
            <div className="chatgptbox-ask-input-popup">
              <div className="selected-text-display">{selection}</div>
              <hr className="divider" />
              <div className="input-with-icon">
                <textarea
                  value={inputText}
                  onChange={handleAskInputChange}
                  onKeyDown={handleAskKeyDown}
                  className="popup-textarea"
                  placeholder="Type your question here..."
                />
                <ArrowRightCircleFill
                  size={25}
                  onClick={handleAskSendClick}
                  className="send-icon"
                />
              </div>
            </div>
          )}
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
          <div
            className="chatgptbox-selection-toolbar-button"
            style={{ height: '100%' }}
            onClick={toggleHiddenTools}
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
          </div>
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
