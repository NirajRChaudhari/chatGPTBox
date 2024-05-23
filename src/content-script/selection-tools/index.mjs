import {
  CardHeading,
  CardList,
  EmojiSmile,
  Translate,
  Braces,
  Globe,
  JournalText,
  PersonHeart,
  CheckCircleFill,
  Magic,
  ArrowsCollapse,
  ArrowsAngleExpand,
} from 'react-bootstrap-icons'
import { getPreferredLanguage } from '../../config/language.mjs'
import { PersonalChatGPTBoxConfig } from '../../config/index.mjs'

const createGenPrompt =
  ({
    message = '',
    isTranslation = false,
    targetLanguage = '',
    enableBidirectional = false,
    includeLanguagePrefix = false,
  }) =>
  async (selection) => {
    let preferredLanguage = targetLanguage

    if (!preferredLanguage) {
      preferredLanguage = await getPreferredLanguage()
    }

    message = 'Perform the task independently of the preceding discussion and context. ' + message

    let fullMessage = isTranslation
      ? `Translate the following into ${preferredLanguage} and only show me the translated content`
      : message
    if (enableBidirectional) {
      fullMessage += `. If it is already in ${preferredLanguage}, translate it into English and only show me the translated content`
    }
    const prefix = includeLanguagePrefix ? `Reply in ${preferredLanguage}.` : ''

    console.log(`${prefix}${fullMessage}:\n'''\n${selection}\n'''`)

    return `${prefix}${fullMessage}:\n'''\n${selection}\n'''`
  }

const commonStyle = {
  transform: 'scale(0.7)',
  borderRadius: '0px',
  margin: '3px 4px',
}

export const config = {
  improve: {
    icon: <Magic style={{ ...commonStyle }} />,
    label: 'Improve',
    genPrompt: createGenPrompt({
      message: `You are a highly skilled AI trained in language understanding and writing improvement. I would like you to read the text delimited by triple quotes below and make improvements to it. Aim to retain the original meaning and structure, keeping similar character length and format, for a coherent and readable experience.
        Only give me the output and nothing else. Do not wrap responses in quotes.No fillers. Respond in the the same language(in other words don't change the language).`,
    }),
  },
  fixError: {
    icon: <CheckCircleFill style={{ ...commonStyle }} />,
    label: 'Fix Error',
    genPrompt: createGenPrompt({
      message: `You are a highly skilled AI trained in language understanding and writing improvement. I would like you to read the text delimited by triple quotes and make improvements to it. Aim to retain the original meaning and structure, keeping similar character length and format, for a coherent and readable experience. Reorder the sentences and rephrase the text. Keep text relatively consise without loosing any important information.
      Only give me the output and nothing else. Do not wrap responses in quotes. Respond in the the same language(in other words don't change the language).No fillers. Text to perform task is given in triple quotes below:`,
    }),
  },
  assistant: {
    icon: <PersonHeart style={{ ...commonStyle }} />,
    label: 'Assistant',
    genPrompt: createGenPrompt({
      message: `Act as a Career Assistant for ${PersonalChatGPTBoxConfig.full_name}, a highly skilled AI trained in language understanding and writing improvement. Your task is to read the provided Prompt text delimited by triple quotes and offer tailored responses based on ${PersonalChatGPTBoxConfig.first_name}'s professional and academic profile. Always reply as if you are ${PersonalChatGPTBoxConfig.first_name} and the prompt is directed to you. Incorporate relevant details and his 3D portfolio website at http://nirajrchaudhari.github.io/ to highlight his skills when necessary. Use specific details from his resume to provide comprehensive and relevant answers. Access extra information about the topic or company mentioned in the prompt from the online internet and training data if needed.

      Summary of ${PersonalChatGPTBoxConfig.full_name}'s resume:
      ${PersonalChatGPTBoxConfig.resume_content}
      
      Answer the below prompt, when responding as ${PersonalChatGPTBoxConfig.first_name}, tailor your answers to reflect the extensive and specific details of his background and achievements, utilizing his website to enhance your responses where applicable. Only give me the output as consise paragraphs and nothing else, no filler text. Do not wrap responses in quotes.
      
      \n Prompt to Answer is given in triple quotes below:`,
      includeLanguagePrefix: true,
    }),
  },
  explain: {
    icon: <JournalText style={{ ...commonStyle }} />,
    label: 'Explain',
    genPrompt: createGenPrompt({
      message: 'Explain the following in great detail and in a way that is easy to understand : ',
      includeLanguagePrefix: true,
    }),
  },
  makeShorter: {
    icon: <ArrowsCollapse style={{ ...commonStyle }} />,
    label: 'Shorter',
    genPrompt: createGenPrompt({
      message: `Rewrite the text delimited by triple quotes and output it shorter to be no more than half the number of characters of the original text. Keep the meaning the same. Only give me the output and nothing else.Do not wrap responses in quotes.  Now, using the concepts above, re-write the following text. Respond in the same language variety or dialect of the given text. No fillers. 
      Text to perform task is given in triple quotes below:`,
    }),
  },
  makeLonger: {
    icon: <ArrowsAngleExpand style={{ ...commonStyle }} />,
    label: 'Longer',
    genPrompt: createGenPrompt({
      message: `Rewrite the text delimited by triple quotes and output it longer to be more than twice the number of characters of the original text. Keep the meaning the same. Only give me the output and nothing else. Do not wrap responses in quotes.  Now, using the concepts above, re-write the following text. Respond in the same language variety or dialect of the given text. No fillers. 
      Text to perform task is given in triple quotes below:`,
    }),
  },
  translate: {
    icon: <Translate style={{ ...commonStyle }} />,
    label: 'Translate',
    genPrompt: createGenPrompt({
      isTranslation: true,
    }),
  },
  translateToEn: {
    icon: <Globe style={{ ...commonStyle }} />,
    label: `Translate (To English)`,
    genPrompt: createGenPrompt({
      isTranslation: true,
      targetLanguage: 'English',
    }),
  },
  translateToZh: {
    icon: <Globe style={{ ...commonStyle }} />,
    label: 'Translate (To Chinese)',
    genPrompt: createGenPrompt({
      isTranslation: true,
      targetLanguage: 'Chinese',
    }),
  },
  translateBidi: {
    icon: <Globe style={{ ...commonStyle }} />,
    label: 'Translate (Bidirectional)',
    genPrompt: createGenPrompt({
      isTranslation: true,
      enableBidirectional: true,
    }),
  },
  summary: {
    icon: <CardHeading style={{ ...commonStyle }} />,
    label: 'Summary',
    genPrompt: createGenPrompt({
      message: `You are a highly skilled AI trained in language comprehension and summarization. I would like you to read the text delimited by triple quotes and summarize it into a concise abstract paragraph. Aim to retain the most important points, providing a coherent and readable summary that could help a person understand the main points of the discussion without needing to read the entire text. Please avoid unnecessary details or tangential points.
      Only give me the output and nothing else. Do not wrap responses in quotes. No fillers. Text to perform task is given in triple quotes below:`,
      includeLanguagePrefix: true,
    }),
  },
  sentiment: {
    icon: <EmojiSmile style={{ ...commonStyle }} />,
    label: 'Sentiment Analysis',
    genPrompt: createGenPrompt({
      message:
        'Analyze the sentiments expressed in the following content and make a brief summary of the sentiments',
      includeLanguagePrefix: true,
    }),
  },
  divide: {
    icon: <CardList style={{ ...commonStyle }} />,
    label: 'Divide Paragraphs',
    genPrompt: createGenPrompt({
      message: 'Divide the following into paragraphs that are easy to read and understand',
    }),
  },
  code: {
    icon: <Braces style={{ ...commonStyle }} />,
    label: 'Code Explain',
    genPrompt: createGenPrompt({
      message: 'Explain the following code',
      includeLanguagePrefix: true,
    }),
  },
}
