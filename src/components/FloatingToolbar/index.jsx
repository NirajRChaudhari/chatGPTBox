import { cloneElement, useCallback, useEffect, useState } from 'react'
import ConversationCard from '../ConversationCard'
import PropTypes from 'prop-types'
import { config as toolsConfig } from '../../content-script/selection-tools'
import { getClientPosition, isMobile, setElementPositionInViewport } from '../../utils'
import Draggable from 'react-draggable'
import { useClampWindowSize } from '../../hooks/use-clamp-window-size'
import { useTranslation } from 'react-i18next'
import { useConfig } from '../../hooks/use-config.mjs'
import { ThreeDots } from 'react-bootstrap-icons'
import { Models } from '../../config/index.mjs'

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
              />
            </div>
          </div>
        </Draggable>
      </div>
    )
  } else {
    if (config.activeSelectionTools.length === 0) return <div />

    const tools = []
    const maxVisibleTools = 4 // Maximum number of visible tools

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

    // Toggle visibility of hidden tools
    const toggleHiddenTools = () => {
      setHiddenToolsVisible(!hiddenToolsVisible)
    }

    return (
      <div data-theme={config.themeMode}>
        <div className="chatgptbox-selection-toolbar">
          {/* Model selection dropdown */}
          <select
            className="normal-button"
            onChange={(e) => {
              const modelName = e.target.value
              const newSession = {
                ...session,
                modelName,
                aiName: Models[modelName].desc,
              }
              setSession(newSession)
            }}
            value={session.modelName}
          >
            {config.activeApiModes.map((modelName) => {
              let desc = modelName
              if (modelName in Models) {
                desc = `${t(Models[modelName].desc)}`
              }
              return (
                <option key={modelName} value={modelName}>
                  {desc}
                </option>
              )
            })}
          </select>

          {visibleTools.map((tool, index) => (
            <div key={index} className="chatgptbox-selection-toolbar-button" onClick={tool.onClick}>
              {tool.icon}
              <span className="tool-label">{tool.label}</span>{' '}
              {/* Add label to each visible tool */}
            </div>
          ))}
          <div className="chatgptbox-selection-toolbar-button" onClick={toggleHiddenTools}>
            <ThreeDots size={24} />
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
                  <span className="tool-label">{tool.label}</span>{' '}
                  {/* Add label to each hidden tool */}
                </div>
              ))}
            </div>
          )}
        </div>
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
}

export default FloatingToolbar
