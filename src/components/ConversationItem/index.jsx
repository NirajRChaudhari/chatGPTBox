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

function AnswerTitle({ descName, modelName }) {
  const { t } = useTranslation()
  const config = useConfig()

  return (
    <p style="white-space: nowrap;">
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

  const replaceTextInFocusedInput = () => {
    // Ensure the focused input exists and is either an INPUT or TEXTAREA
    if (focusedInput && (focusedInput.tagName === 'INPUT' || focusedInput.tagName === 'TEXTAREA')) {
      const text = content
      const { selectionStart, selectionEnd } = focusedInput

      // Decide whether to add a newline based on the element type
      const replacementText = focusedInput.tagName === 'TEXTAREA' ? text + '\n' : text

      // Replace the selected text with the new text, potentially including a newline
      focusedInput.value =
        focusedInput.value.substring(0, selectionStart) +
        replacementText +
        focusedInput.value.substring(selectionEnd)

      // Refocus the input and set the cursor position right after the newly inserted text
      focusedInput.focus()
      const newCursorPos = selectionStart + replacementText.length
      focusedInput.setSelectionRange(newCursorPos, newCursorPos)

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
              <CopyButton contentFn={() => content.replace(/\n<hr\/>$/, '')} size={14} />
              <ReadButton contentFn={() => content} size={14} />
              {!collapsed ? (
                <span
                  title={t('Collapse')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                >
                  <XCircleIcon size={14} />
                </span>
              ) : (
                <span
                  title={t('Expand')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronDownIcon size={14} />
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
            <AnswerTitle descName={descName} modelName={modelName} />
            <div className="gpt-util-group">
              {focusedInput && (
                <>
                  <TextareaT
                    onClick={replaceTextInFocusedInput}
                    style={{ cursor: 'pointer', fontSize: '20px' }}
                    data-tip={t('Replace Text')}
                  />
                  <ReactTooltip />
                </>
              )}

              {onRetry && (
                <span title={t('Retry')} className="gpt-util-icon" onClick={onRetry}>
                  <SyncIcon size={14} />
                </span>
              )}
              {modelName && (
                <CopyButton contentFn={() => content.replace(/\n<hr\/>$/, '')} size={14} />
              )}
              {modelName && <ReadButton contentFn={() => content} size={14} />}
              {!collapsed ? (
                <span
                  title={t('Collapse')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                >
                  <XCircleIcon size={14} />
                </span>
              ) : (
                <span
                  title={t('Expand')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronDownIcon size={14} />
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
                <span title={t('Retry')} className="gpt-util-icon" onClick={onRetry}>
                  <SyncIcon size={14} />
                </span>
              )}
              <CopyButton contentFn={() => content.replace(/\n<hr\/>$/, '')} size={14} />
              {!collapsed ? (
                <span
                  title={t('Collapse')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(true)}
                >
                  <XCircleIcon size={14} />
                </span>
              ) : (
                <span
                  title={t('Expand')}
                  className="gpt-util-icon"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronDownIcon size={14} />
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
