import './styles.scss'
import { createRoot } from 'react-dom/client'
import { render } from 'preact'
import DecisionCard from '../components/DecisionCard'
import { config as siteConfig } from './site-adapters'
import { config as toolsConfig } from './selection-tools'
import { config as menuConfig } from './menu-tools'
import {
  chatgptWebModelKeys,
  getPreferredLanguageKey,
  getUserConfig,
  setAccessToken,
  setUserConfig,
} from '../config/index.mjs'
import {
  createElementAtPosition,
  cropText,
  getClientPosition,
  getPossibleElementByQuerySelector,
} from '../utils'
import { findClosestEditableAncestor } from '../utils/find-closest-editable-ancestor'
import { ensureFloatingToolbarVisibilityInsideScreen } from '../utils/ensure-floating-toolbar-visibility-inside-screen'
import FloatingToolbar from '../components/FloatingToolbar'
import Browser from 'webextension-polyfill'
import { getPreferredLanguage } from '../config/language.mjs'
import '../_locales/i18n-react'
import { changeLanguage } from 'i18next'
import { initSession } from '../services/init-session.mjs'
import { getChatGptAccessToken, registerPortListener } from '../services/wrappers.mjs'
import { generateAnswersWithChatgptWebApi } from '../services/apis/chatgpt-web.mjs'
import NotificationForChatGPTWeb from '../components/NotificationForChatGPTWeb'

/**
 * @param {SiteConfig} siteConfig
 * @param {UserConfig} userConfig
 */

let focusedInput = null

let decisionCardRoot = null // We'll store our root here

async function mountComponent(siteConfig, userConfig) {
  const retry = 10
  let oldUrl = location.href
  for (let i = 1; i <= retry; i++) {
    if (location.href !== oldUrl) {
      console.log(`SiteAdapters Retry ${i}/${retry}: stop`)
      return
    }
    const e =
      (siteConfig &&
        (getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery) ||
          getPossibleElementByQuerySelector(siteConfig.appendContainerQuery) ||
          getPossibleElementByQuerySelector(siteConfig.resultsContainerQuery))) ||
      getPossibleElementByQuerySelector([userConfig.prependQuery]) ||
      getPossibleElementByQuerySelector([userConfig.appendQuery])
    if (e) {
      console.log(`SiteAdapters Retry ${i}/${retry}: found`)
      console.log(e)
      break
    } else {
      console.log(`SiteAdapters Retry ${i}/${retry}: not found`)
      if (i === retry) return
      else await new Promise((r) => setTimeout(r, 500))
    }
  }
  document.querySelectorAll('.chatgptbox-container,#chatgptbox-container').forEach((e) => {
    if (decisionCardRoot) {
      decisionCardRoot.unmount() // Unmounting if there was a previous instance
      e.remove()
    }
  })

  let question
  if (userConfig.inputQuery) question = await getInput([userConfig.inputQuery])
  if (!question && siteConfig) question = await getInput(siteConfig.inputQuery)

  const position = {
    x: window.innerWidth - 300 - Math.floor((20 / 100) * window.innerWidth),
    y: window.innerHeight / 2 - 200,
  }
  const toolbarContainer = createElementAtPosition(position.x, position.y)
  toolbarContainer.className = 'chatgptbox-toolbar-container-not-queryable'
  if (userConfig.displayMode === 'floatingToolbar') {
    render(
      <FloatingToolbar
        session={initSession({ modelName: userConfig.modelName })}
        selection={question}
        container={toolbarContainer}
        dockable={true}
        triggered={true}
        closeable={true}
        prompt={question}
      />,
      toolbarContainer,
    )
    return
  }
  const container = document.createElement('div')
  container.id = 'chatgptbox-container'
  if (decisionCardRoot) {
    decisionCardRoot.unmount() // Unmounting if there was a previous instance
  }
  decisionCardRoot = createRoot(container) // Create a root for the container
  decisionCardRoot.render(
    <DecisionCard
      session={initSession({ modelName: (await getUserConfig()).modelName })}
      question={question}
      siteConfig={siteConfig}
      focusedInput={focusedInput}
      container={container}
    />,
  )
}

/**
 * @param {string[]|function} inputQuery
 * @returns {Promise<string>}
 */
async function getInput(inputQuery) {
  let input
  if (typeof inputQuery === 'function') {
    input = await inputQuery()
    const replyPromptBelow = `Reply in ${await getPreferredLanguage()}. Regardless of the language of content I provide below. !!This is very important!!`
    const replyPromptAbove = `Reply in ${await getPreferredLanguage()}. Regardless of the language of content I provide above. !!This is very important!!`
    if (input) return `${replyPromptBelow}\n\n` + input + `\n\n${replyPromptAbove}`
    return input
  }
  const searchInput = getPossibleElementByQuerySelector(inputQuery)
  if (searchInput) {
    if (searchInput.value) input = searchInput.value
    else if (searchInput.textContent) input = searchInput.textContent
    if (input)
      return (
        `Reply in ${await getPreferredLanguage()}.\nThe following is a search input in a search engine, ` +
        `giving useful content or solutions and as much information as you can related to it, ` +
        `use markdown syntax to make your answer more readable, such as code blocks, bold, list:\n` +
        input
      )
  }
}

let toolbarContainer

const checkIfClickedInsideToolbar = (toolbarContainer, e) => {
  // Search for all .chatgptbox-template-popup-container and check if the target is inside any of them

  let isTemplatePopupContainer = false
  const templatePopupContainers = document.querySelectorAll('.chatgptbox-template-popup-container')
  for (let i = 0; i < templatePopupContainers.length; i++) {
    if (
      templatePopupContainers[i] instanceof Node &&
      e.target instanceof Node &&
      templatePopupContainers[i].contains(e.target)
    ) {
      isTemplatePopupContainer = true
      break
    }
  }

  if (
    toolbarContainer &&
    ((toolbarContainer instanceof Node &&
      e.target instanceof Node &&
      toolbarContainer.contains(e.target)) ||
      (document.querySelector('.chatgptbox-template-popup-container') && isTemplatePopupContainer))
  ) {
    return true
  } else {
    return false
  }
}

const deleteToolbar = () => {
  if (toolbarContainer && toolbarContainer.className === 'chatgptbox-toolbar-container')
    toolbarContainer.remove()
}

const createSelectionTools = async (toolbarContainer, selection) => {
  toolbarContainer.className = 'chatgptbox-toolbar-container'
  render(
    <FloatingToolbar
      session={initSession({ modelName: (await getUserConfig()).modelName })}
      selection={selection}
      container={toolbarContainer}
      dockable={true}
      focusedInput={focusedInput}
    />,
    toolbarContainer,
  )
}

function checkIfExcludedElement(element) {
  // List of classes of input that should not be focused
  const excludedClasses = ['chat-box-popup-textarea']

  // Check if the target is an excluded class
  if (excludedClasses.some((excludedClass) => element.classList.contains(excludedClass))) {
    return true
  }

  return false
}

async function prepareForSelectionTools() {
  document.addEventListener('mouseup', (e) => {
    if (checkIfExcludedElement(e.target)) {
      return
    }

    // Update focused input element
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      if (findClosestEditableAncestor(e.target)) {
        focusedInput = e.target
      }
    }

    // If the toolbar is already open, and the click is inside the toolbar, do nothing
    if (checkIfClickedInsideToolbar(toolbarContainer, e)) return

    const selectionElement =
      window.getSelection()?.rangeCount > 0 &&
      window.getSelection()?.getRangeAt(0).endContainer.parentElement

    if (selectionElement && checkIfClickedInsideToolbar(toolbarContainer, selectionElement)) return

    deleteToolbar()
    setTimeout(async () => {
      const selection = window
        .getSelection()
        ?.toString()
        .trim()
        .replace(/^-+|-+$/g, '')
      if (selection) {
        let position

        const config = await getUserConfig()
        if (!config.selectionToolsNextToInputBox) position = { x: e.pageX, y: e.pageY }
        else {
          let inputElement = null

          if (selectionElement && findClosestEditableAncestor(selectionElement)) {
            inputElement = selectionElement
          }

          if (inputElement) {
            position = getClientPosition(inputElement, true)
            // position = {
            //   x: position.x + window.scrollX + inputElement.offsetWidth,
            //   y: e.pageY,
            // }
          } else {
            position = { x: e.pageX, y: e.pageY }
          }
        }
        position.y += 20
        position = ensureFloatingToolbarVisibilityInsideScreen(position)
        toolbarContainer = createElementAtPosition(position.x, position.y)
        await createSelectionTools(toolbarContainer, selection)
      }
    })
  })
  document.addEventListener('mousedown', (e) => {
    // Update focused input element
    if (focusedInput) {
      focusedInput = null
    }

    // If the toolbar is already open, and the click is inside the toolbar, do nothing
    if (checkIfClickedInsideToolbar(toolbarContainer, e)) return

    // If toolbar is docked, do nothing
    if (
      toolbarContainer &&
      toolbarContainer.classList.contains('chatgptbox-toolbar-container-docked')
    ) {
      return
    }

    // Delete toolbar if the user clicks outside of it
    document.querySelectorAll('.chatgptbox-toolbar-container').forEach((e) => e.remove())
  })
  document.addEventListener('keydown', (e) => {
    if (checkIfExcludedElement(e.target)) {
      return
    }
    // Delete toolbar if the user is typing in an input or textarea
    if (
      toolbarContainer &&
      e.target instanceof Node &&
      !toolbarContainer.contains(e.target) &&
      findClosestEditableAncestor(e.target)
    ) {
      setTimeout(() => {
        if (!window.getSelection()?.toString().trim()) deleteToolbar()
      })
    }

    // Detect Ctrl+A selection and Shift+Arrow selection
    if (
      ((e.ctrlKey || e.metaKey) && e.key === 'a') ||
      (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key))
    ) {
      deleteToolbar()

      setTimeout(() => {
        const selection = window.getSelection()
        if (
          selection.toString().length > 0 &&
          document.activeElement &&
          findClosestEditableAncestor(document.activeElement)
        ) {
          focusedInput = document.activeElement

          // console.log('Ctrl+A selection detected in:', focusedInput)

          setTimeout(async () => {
            const selection = window
              .getSelection()
              ?.toString()
              .trim()
              .replace(/^-+|-+$/g, '')

            if (selection) {
              let position = getClientPosition(focusedInput, true)

              position = {
                x: position.x + focusedInput.offsetWidth - 400,
                y: position.y - 20,
              }

              position = ensureFloatingToolbarVisibilityInsideScreen(position)
              toolbarContainer = createElementAtPosition(position.x, position.y)
              await createSelectionTools(toolbarContainer, selection)
            }
          })
        }
      }, 100)
    }
  })
}

async function prepareForSelectionToolsTouch() {
  document.addEventListener('touchend', (e) => {
    if (checkIfClickedInsideToolbar(toolbarContainer, e)) return
    if (
      checkIfClickedInsideToolbar(
        toolbarContainer,
        window.getSelection()?.getRangeAt(0).endContainer.parentElement,
      ) &&
      window.getSelection()?.rangeCount > 0
    )
      return

    deleteToolbar()
    setTimeout(() => {
      const selection = window
        .getSelection()
        ?.toString()
        .trim()
        .replace(/^-+|-+$/g, '')
      if (selection) {
        let position = { x: e.changedTouches[0].pageX + 20, y: e.changedTouches[0].pageY + 20 }

        position = ensureFloatingToolbarVisibilityInsideScreen(position)

        toolbarContainer = createElementAtPosition(position.x, position.y)
        createSelectionTools(toolbarContainer, selection)
      }
    })
  })
  document.addEventListener('touchstart', (e) => {
    if (checkIfClickedInsideToolbar(toolbarContainer, e)) return

    document.querySelectorAll('.chatgptbox-toolbar-container').forEach((e) => e.remove())
  })
}

let menuX, menuY

async function prepareForRightClickMenu() {
  document.addEventListener('contextmenu', (e) => {
    menuX = e.clientX
    menuY = e.clientY
  })

  Browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'CREATE_CHAT') {
      const data = message.data
      let prompt = ''
      if (data.itemId in toolsConfig) {
        prompt = await toolsConfig[data.itemId].genPrompt(data.selectionText)
      } else if (data.itemId in menuConfig) {
        const menuItem = menuConfig[data.itemId]
        if (!menuItem.genPrompt) return
        else prompt = await menuItem.genPrompt()
        if (prompt) prompt = await cropText(`Reply in ${await getPreferredLanguage()}.\n` + prompt)
      }

      let position = data.useMenuPosition
        ? { x: menuX, y: menuY }
        : { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200 }

      position = ensureFloatingToolbarVisibilityInsideScreen(position)
      const container = createElementAtPosition(position.x, position.y)
      container.className = 'chatgptbox-toolbar-container-docked'
      render(
        <FloatingToolbar
          session={initSession({ modelName: (await getUserConfig()).modelName })}
          selection={data.selectionText}
          container={container}
          triggered={true}
          closeable={true}
          prompt={prompt}
          focusedInput={focusedInput}
        />,
        container,
      )
    }
  })
}

async function prepareForStaticCard() {
  const userConfig = await getUserConfig()
  let siteRegex
  if (userConfig.useSiteRegexOnly) siteRegex = userConfig.siteRegex
  else
    siteRegex = new RegExp(
      (userConfig.siteRegex && userConfig.siteRegex + '|') + Object.keys(siteConfig).join('|'),
    )

  const matches = location.hostname.match(siteRegex)
  if (matches) {
    const siteName = matches[0]

    if (
      userConfig.siteAdapters.includes(siteName) &&
      !userConfig.activeSiteAdapters.includes(siteName)
    )
      return

    let initSuccess = true
    if (siteName in siteConfig) {
      const siteAction = siteConfig[siteName].action
      if (siteAction && siteAction.init) {
        initSuccess = await siteAction.init(location.hostname, userConfig, getInput, mountComponent)
      }
    }

    if (initSuccess) mountComponent(siteConfig[siteName], userConfig)
  }
}

async function overwriteAccessToken() {
  if (location.hostname !== 'chatgpt.com') {
    if (location.hostname === 'kimi.moonshot.cn') {
      setUserConfig({
        kimiMoonShotRefreshToken: window.localStorage.refresh_token,
      })
    }
    return
  }

  let data
  if (location.pathname === '/api/auth/session') {
    const response = document.querySelector('pre').textContent
    try {
      data = JSON.parse(response)
    } catch (error) {
      console.error('json error', error)
    }
  } else {
    const resp = await fetch('https://chatgpt.com/api/auth/session')
    data = await resp.json().catch(() => ({}))
  }
  if (data && data.accessToken) {
    await setAccessToken(data.accessToken)
    console.log(data.accessToken)
  }
}

async function prepareForForegroundRequests() {
  if (location.hostname !== 'chatgpt.com' || location.pathname === '/auth/login') return

  const userConfig = await getUserConfig()

  if (!chatgptWebModelKeys.some((model) => userConfig.activeApiModes.includes(model))) return

  const url = new URL(window.location.href)
  if (
    url.searchParams.has('chatgptbox_notification') &&
    chatgptWebModelKeys.includes(userConfig.modelName)
  ) {
    const div = document.createElement('div')
    document.body.append(div)
    render(<NotificationForChatGPTWeb container={div} />, div)
  }

  if (location.pathname === '/') {
    const input = document.querySelector('#prompt-textarea')
    if (input) {
      input.textContent = ' '
      input.dispatchEvent(new Event('input', { bubbles: true }))
      setTimeout(() => {
        input.textContent = ''
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, 300)
    }
  }

  await Browser.runtime.sendMessage({
    type: 'SET_CHATGPT_TAB',
    data: {},
  })

  registerPortListener(async (session, port) => {
    if (chatgptWebModelKeys.includes(session.modelName)) {
      const accessToken = await getChatGptAccessToken()
      await generateAnswersWithChatgptWebApi(port, session.question, session, accessToken)
    }
  })
}

async function run() {
  await getPreferredLanguageKey().then((lang) => {
    changeLanguage(lang)
  })
  Browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'CHANGE_LANG') {
      const data = message.data
      changeLanguage(data.lang)
    }
  })

  await overwriteAccessToken()
  await prepareForForegroundRequests()

  prepareForSelectionTools()
  prepareForSelectionToolsTouch()
  prepareForStaticCard()
  prepareForRightClickMenu()
}

run()
