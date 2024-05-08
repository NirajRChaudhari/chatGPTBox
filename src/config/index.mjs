import { defaults } from 'lodash-es'
import Browser from 'webextension-polyfill'
import { isMobile } from '../utils/is-mobile.mjs'

export const TriggerMode = {
  always: 'Always',
  questionMark: 'When query ends with question mark (?)',
  manually: 'Manually',
}

export const ThemeMode = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
}

export const ModelMode = {
  balanced: 'Balanced',
  creative: 'Creative',
  precise: 'Precise',
  fast: 'Fast',
}

export const chatgptWebModelKeys = [
  'chatgptFree35',
  'chatgptPlus4',
  'chatgptFree35Mobile',
  'chatgptPlus4Browsing',
  'chatgptPlus4Mobile',
]
export const bingWebModelKeys = ['bingFree4', 'bingFreeSydney']
export const bardWebModelKeys = ['bardWebFree']
export const claudeWebModelKeys = ['claude2WebFree']
export const moonshotWebModelKeys = ['moonshotWebFree']
export const gptApiModelKeys = ['gptApiInstruct', 'gptApiDavinci']
export const chatgptApiModelKeys = [
  'chatgptApi35',
  'chatgptApi35_16k',
  'chatgptApi35_1106',
  'chatgptApi35_0125',
  'chatgptApi4_8k',
  'chatgptApi4_8k_0613',
  'chatgptApi4_32k',
  'chatgptApi4_32k_0613',
  'chatgptApi4_128k',
  'chatgptApi4_128k_preview',
  'chatgptApi4_128k_1106_preview',
  'chatgptApi4_128k_0125_preview',
]
export const customApiModelKeys = ['customModel']
export const azureOpenAiApiModelKeys = ['azureOpenAi']
export const claudeApiModelKeys = [
  'claude12Api',
  'claude2Api',
  'claude21Api',
  'claude3HaikuApi',
  'claude3SonnetApi',
  'claude3OpusApi',
]
export const chatglmApiModelKeys = ['chatglmTurbo']
export const githubThirdPartyApiModelKeys = ['waylaidwandererApi']
export const poeWebModelKeys = [
  'poeAiWebSage', //poe.com/Assistant
  'poeAiWebGPT4',
  'poeAiWebGPT4_32k',
  'poeAiWebClaudePlus',
  'poeAiWebClaude',
  'poeAiWebClaude100k',
  'poeAiWebCustom',
  'poeAiWebChatGpt',
  'poeAiWebChatGpt_16k',
  'poeAiWebGooglePaLM',
  'poeAiWeb_Llama_2_7b',
  'poeAiWeb_Llama_2_13b',
  'poeAiWeb_Llama_2_70b',
]
export const moonshotApiModelKeys = ['moonshot_v1_8k', 'moonshot_v1_32k', 'moonshot_v1_128k']

/**
 * @typedef {object} Model
 * @property {string} value
 * @property {string} desc
 */
/**
 * @type {Object.<string,Model>}
 */
export const Models = {
  chatgptFree35: { value: 'text-davinci-002-render-sha', desc: 'ChatGPT (Web)' },

  chatgptPlus4: { value: 'gpt-4', desc: 'ChatGPT (Web, GPT-4 All in one)' },
  chatgptPlus4Browsing: { value: 'gpt-4-gizmo', desc: 'ChatGPT (Web, GPT-4)' },

  chatgptApi35: { value: 'gpt-3.5-turbo', desc: 'ChatGPT (GPT-3.5-turbo)' },
  chatgptApi35_16k: { value: 'gpt-3.5-turbo-16k', desc: 'ChatGPT (GPT-3.5-turbo-16k)' },

  chatgptApi4_8k: { value: 'gpt-4', desc: 'ChatGPT (GPT-4-8k)' },
  chatgptApi4_32k: { value: 'gpt-4-32k', desc: 'ChatGPT (GPT-4-32k)' },
  chatgptApi4_128k: {
    value: 'gpt-4-turbo',
    desc: 'ChatGPT (GPT-4-Turbo 128k)',
  },
  chatgptApi4_128k_preview: {
    value: 'gpt-4-turbo-preview',
    desc: 'ChatGPT (GPT-4-Turbo 128k Preview)',
  },
  chatgptApi4_128k_1106_preview: {
    value: 'gpt-4-1106-preview',
    desc: 'ChatGPT (GPT-4-Turbo 128k 1106 Preview)',
  },
  chatgptApi4_128k_0125_preview: {
    value: 'gpt-4-0125-preview',
    desc: 'ChatGPT (GPT-4-Turbo 128k 0125 Preview)',
  },

  claude2WebFree: { value: '', desc: 'Claude.ai (Web)' },
  claude12Api: { value: 'claude-instant-1.2', desc: 'Claude.ai (API, Claude Instant 1.2)' },
  claude2Api: { value: 'claude-2.0', desc: 'Claude.ai (API, Claude 2)' },
  claude21Api: { value: 'claude-2.1', desc: 'Claude.ai (API, Claude 2.1)' },
  claude3HaikuApi: {
    value: 'claude-3-haiku-20240307',
    desc: 'Claude.ai (API, Claude 3 Haiku)',
  },
  claude3SonnetApi: { value: 'claude-3-sonnet-20240229', desc: 'Claude.ai (API, Claude 3 Sonnet)' },
  claude3OpusApi: { value: 'claude-3-opus-20240229', desc: 'Claude.ai (API, Claude 3 Opus)' },

  bingFree4: { value: '', desc: 'Bing (Web, GPT-4)' },
  bingFreeSydney: { value: '', desc: 'Bing (Web, GPT-4, Sydney)' },

  moonshotWebFree: { value: '', desc: 'Kimi.Moonshot (Web, 100k)' },

  bardWebFree: { value: '', desc: 'Gemini (Web)' },

  chatglmTurbo: { value: 'chatglm_turbo', desc: 'ChatGLM (ChatGLM-Turbo)' },

  chatgptFree35Mobile: { value: 'text-davinci-002-render-sha-mobile', desc: 'ChatGPT (Mobile)' },
  chatgptPlus4Mobile: { value: 'gpt-4-mobile', desc: 'ChatGPT (Mobile, GPT-4)' },

  chatgptApi35_1106: { value: 'gpt-3.5-turbo-1106', desc: 'ChatGPT (GPT-3.5-turbo 1106)' },
  chatgptApi35_0125: { value: 'gpt-3.5-turbo-0125', desc: 'ChatGPT (GPT-3.5-turbo 0125)' },
  chatgptApi4_8k_0613: { value: 'gpt-4', desc: 'ChatGPT (GPT-4-8k 0613)' },
  chatgptApi4_32k_0613: { value: 'gpt-4-32k', desc: 'ChatGPT (GPT-4-32k 0613)' },

  gptApiInstruct: { value: 'gpt-3.5-turbo-instruct', desc: 'GPT-3.5-turbo Instruct' },
  gptApiDavinci: { value: 'text-davinci-003', desc: 'GPT-3.5' },

  customModel: { value: '', desc: 'Custom Model' },
  azureOpenAi: { value: '', desc: 'ChatGPT (Azure)' },
  waylaidwandererApi: { value: '', desc: 'Waylaidwanderer API (Github)' },

  poeAiWebSage: { value: 'Assistant', desc: 'Poe AI (Web, Assistant)' },
  poeAiWebGPT4: { value: 'gpt-4', desc: 'Poe AI (Web, GPT-4)' },
  poeAiWebGPT4_32k: { value: 'gpt-4-32k', desc: 'Poe AI (Web, GPT-4-32k)' },
  poeAiWebClaudePlus: { value: 'claude-2-100k', desc: 'Poe AI (Web, Claude 2 100k)' },
  poeAiWebClaude: { value: 'claude-instant', desc: 'Poe AI (Web, Claude instant)' },
  poeAiWebClaude100k: { value: 'claude-instant-100k', desc: 'Poe AI (Web, Claude instant 100k)' },
  poeAiWebGooglePaLM: { value: 'Google-PaLM', desc: 'Poe AI (Web, Google-PaLM)' },
  poeAiWeb_Llama_2_7b: { value: 'Llama-2-7b', desc: 'Poe AI (Web, Llama-2-7b)' },
  poeAiWeb_Llama_2_13b: { value: 'Llama-2-13b', desc: 'Poe AI (Web, Llama-2-13b)' },
  poeAiWeb_Llama_2_70b: { value: 'Llama-2-70b', desc: 'Poe AI (Web, Llama-2-70b)' },
  poeAiWebChatGpt: { value: 'chatgpt', desc: 'Poe AI (Web, ChatGPT)' },
  poeAiWebChatGpt_16k: { value: 'chatgpt-16k', desc: 'Poe AI (Web, ChatGPT-16k)' },
  poeAiWebCustom: { value: '', desc: 'Poe AI (Web, Custom)' },

  moonshot_v1_8k: {
    value: 'moonshot-v1-8k',
    desc: 'Moonshot (8k)',
  },
  moonshot_v1_32k: {
    value: 'moonshot-v1-32k',
    desc: 'Moonshot (32k)',
  },
  moonshot_v1_128k: {
    value: 'moonshot-v1-128k',
    desc: 'Moonshot (128k)',
  },
}

for (const modelName in Models) {
  if (isUsingMultiModeModel({ modelName }))
    for (const mode in ModelMode)
      Models[`${modelName}-${mode}`] = {
        value: mode,
        desc: `${Models[modelName].desc} (${ModelMode[mode]})`,
      }
}

/**
 * @typedef {typeof defaultConfig} UserConfig
 */
export const defaultConfig = {
  // general

  /** @type {keyof TriggerMode}*/
  triggerMode: 'manually',
  /** @type {keyof ThemeMode}*/
  themeMode: 'auto',
  /** @type {keyof Models}*/
  modelName: 'chatgptFree35',

  preferredLanguage: getNavigatorLanguage(),
  clickIconAction: 'popup',
  insertAtTop: isMobile(),
  lockWhenAnswer: true,
  answerScrollMargin: 200,
  autoRegenAfterSwitchModel: true,
  selectionToolsNextToInputBox: false,
  alwaysPinWindow: false,
  focusAfterAnswer: true,

  apiKey: '', // openai ApiKey

  azureApiKey: '',
  azureEndpoint: '',
  azureDeploymentName: '',

  poeCustomBotName: '',

  claudeApiKey: '',
  chatglmApiKey: '',
  moonshotApiKey: '',

  customApiKey: '',

  /** @type {keyof ModelMode}*/
  modelMode: 'balanced',

  customModelApiUrl: 'http://localhost:8000/v1/chat/completions',
  customModelName: 'gpt-3.5-turbo',
  githubThirdPartyUrl: 'http://127.0.0.1:3000/conversation',

  // advanced

  maxResponseTokenLength: 1000,
  maxConversationContextLength: 9,
  temperature: 1,
  customChatGptWebApiUrl: 'https://chatgpt.com',
  customChatGptWebApiPath: '/backend-api/conversation',
  customOpenAiApiUrl: 'https://api.openai.com',
  customClaudeApiUrl: 'https://api.anthropic.com',
  disableWebModeHistory: true,
  hideContextMenu: false,
  siteRegex: 'match nothing',
  useSiteRegexOnly: false,
  inputQuery: '',
  appendQuery: '',
  prependQuery: '',

  // others

  alwaysCreateNewConversationWindow: false,
  activeApiModes: [
    'chatgptFree35',
    'chatgptPlus4',
    'bardWebFree',
    'claude2WebFree',
    'bingFree4',
    'bingFree4-balanced',
    'bingFree4-precise',
    'bingFree4-fast',
    'bingFree4-creative',
    'poeAiWebSage',
    'customModel',
  ],
  activeSelectionTools: [
    'improve',
    'fixError',
    'assistant',
    'makeShorter',
    'makeLonger',
    'explain',
    'summary',
    'translate',
    'code',
  ],
  activeSiteAdapters: [
    'bilibili',
    'github',
    'gitlab',
    'quora',
    'reddit',
    'youtube',
    'zhihu',
    'stackoverflow',
    'juejin',
    'mp.weixin.qq',
    'followin',
  ],
  accessToken: '',
  tokenSavedOn: 0,
  bingAccessToken: '',
  chatgptJumpBackTabId: 0,
  chatgptTabId: 0,
  chatgptArkoseReqUrl: '',
  chatgptArkoseReqForm: '',
  kimiMoonShotRefreshToken: '',
  kimiMoonShotAccessToken: '',

  // unchangeable

  userLanguage: getNavigatorLanguage(),
  apiModes: Object.keys(Models),
  chatgptArkoseReqParams: 'cgb=vhwi',
  selectionTools: [
    'explain',
    'fixError',
    'assistant',
    'improve',
    'makeShorter',
    'makeLonger',
    'translate',
    'translateToEn',
    'summary',
    'sentiment',
    'divide',
    'code',
  ],
  selectionToolsDesc: [
    'Explain',
    'Fix Error',
    'Assistant',
    'Improve Writing',
    'Make Shorter',
    'Make Longer',
    'Translate',
    'Translate (To English)',
    'Summary',
    'Sentiment Analysis',
    'Divide Paragraphs',
    'Code Explain',
  ],
  // importing configuration will result in gpt-3-encoder being packaged into the output file
  siteAdapters: [
    'bilibili',
    'github',
    'gitlab',
    'quora',
    'reddit',
    'youtube',
    'zhihu',
    'stackoverflow',
    'juejin',
    'mp.weixin.qq',
    'followin',
  ],
}

export function getNavigatorLanguage() {
  const l = navigator.language.toLowerCase()
  if (['zh-hk', 'zh-mo', 'zh-tw', 'zh-cht', 'zh-hant'].includes(l)) return 'zhHant'
  return navigator.language.substring(0, 2)
}

export function isUsingOpenAiApiKey(configOrSession) {
  return (
    gptApiModelKeys.includes(configOrSession.modelName) ||
    chatgptApiModelKeys.includes(configOrSession.modelName)
  )
}

export function isUsingMultiModeModel(configOrSession) {
  return bingWebModelKeys.includes(configOrSession.modelName)
}

export function isUsingCustomModel(configOrSession) {
  return customApiModelKeys.includes(configOrSession.modelName)
}

export function isUsingChatGLMApi(configOrSession) {
  return chatglmApiModelKeys.includes(configOrSession.modelName)
}

export function isUsingMoonshotApi(configOrSession) {
  return moonshotApiModelKeys.includes(configOrSession.modelName)
}

export function isUsingCustomNameOnlyModel(configOrSession) {
  return configOrSession.modelName === 'poeAiWebCustom'
}

export function isUsingAzureOpenAi(configOrSession) {
  return azureOpenAiApiModelKeys.includes(configOrSession.modelName)
}

export function isUsingClaudeApi(configOrSession) {
  return claudeApiModelKeys.includes(configOrSession.modelName)
}

export function isUsingMoonshotWeb(configOrSession) {
  return moonshotWebModelKeys.includes(configOrSession.modelName)
}

export function isUsingGithubThirdPartyApi(configOrSession) {
  return githubThirdPartyApiModelKeys.includes(configOrSession.modelName)
}

export async function getPreferredLanguageKey() {
  const config = await getUserConfig()
  if (config.preferredLanguage === 'auto') return config.userLanguage
  return config.preferredLanguage
}

/**
 * get user config from local storage
 * @returns {Promise<UserConfig>}
 */
export async function getUserConfig() {
  const options = await Browser.storage.local.get(Object.keys(defaultConfig))
  if (options.customChatGptWebApiUrl === 'https://chat.openai.com')
    options.customChatGptWebApiUrl = 'https://chatgpt.com'
  return defaults(options, defaultConfig)
}

/**
 * set user config to local storage
 * @param {Partial<UserConfig>} value
 */
export async function setUserConfig(value) {
  await Browser.storage.local.set(value)
}

export async function setAccessToken(accessToken) {
  await setUserConfig({ accessToken, tokenSavedOn: Date.now() })
}

const TOKEN_DURATION = 30 * 24 * 3600 * 1000

export async function clearOldAccessToken() {
  const duration = Date.now() - (await getUserConfig()).tokenSavedOn
  if (duration > TOKEN_DURATION) {
    await setAccessToken('')
  }
}

// New configuration added by @Niraj-Chaudhari
export const PersonalChatGPTBoxConfig = {
  first_name: 'Niraj',
  full_name: 'Niraj Chaudhari',
  portfolio: 'https://niraj-chaudhari.github.io/', //Remove this line if you don't have a portfolio don't keep portfolio link empty or null
  resume_content: `Technical Skills:
  - Programming Languages: Java, Python, JavaScript, C++, C#, TypeScript
  - Frameworks: Spring Boot, Django, .NET
  - Frontend: Angular, HTML, CSS, ReactJS
  - Databases: MySQL, MongoDB, Firebase, Redis, Oracle, PostgreSQL
  - Technologies: GitHub, Jenkins, Docker, Kubernetes, Pytorch, XML, OpenCV, Kafka, AWS, Android, Google Cloud
  
  Experience:
  - Software Developer at USC: Developed Node.js backend REST APIs for Health AI Lab, reduced response latency by 18%, integrated a Python GBM machine learning model, revamped Angular frontend with a 26% user engagement increase, deployed on Google Cloud, and set up Prometheus and Grafana monitoring.
  - Software Engineer at Infosys Pvt.: Built Java Spring Boot RESTful APIs for Finacle, led the transition to microservices architecture, engaged in DevOps using Docker, Jenkins, and Spinnaker, and documented designs on Confluence.
  - Software Engineer Intern at Proxel Solutions: Developed an Inventory Management and Analytics System, reduced manual processing by 35%, built Node.js backend, designed MySQL database schema, and utilized Git and Jira for version control and work management.
  
  Education:
  - University of Southern California: M.Sc. in Computer Science, GPA: 3.95/4
  - Savitribai Phule Pune University: B.Eng. in Computer Engineering, GPA: 9.4/10
  
  Projects:
  - AI-based S4 Algorithm: Developed for detecting copy-move forgery, active from Aug 2022 to Apr 2024.
  - Signora Air Signature Library Demo: Utilizes Angular, Node.js, MediaPipe AI, and OpenCV to create a digital signature platform that allows gesture-based air signatures for increased security and convenience.
  - Event Horizon: A Node.js and Angular-based web application for event aggregation and search, featuring cross-platform capabilities and integration with ticket-selling APIs, hosted on Google Cloud.
  - Roomic Android Application: A real-time Android app using GitHub, Java, and Firebase, designed to assist in finding apartments and roommates in new cities based on user preferences.
  
  Achievements:
  - Published a research paper on CNN-based video forgery detection in the Scopus indexed Journal of Design Engineering, Toronto.
  - Winner at the Smart India Hackathon for developing an early detection system for Sepsis using machine learning, solving a problem statement by GE Healthcare.
  
  If needed in response context, add extra imaginary projects and experience to make the response more realistic and aligned to requirements in the prompt.`,
}
