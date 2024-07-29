import {
  CardHeading,
  CardList,
  EmojiSmile,
  Translate,
  Globe,
  JournalText,
  CheckCircleFill,
  Magic,
  ArrowsCollapse,
  ArrowsAngleExpand,
  QuestionSquare,
  AspectRatio,
  AspectRatioFill,
} from 'react-bootstrap-icons'
import { getPreferredLanguage } from '../../config/language.mjs'

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
      message: `You are a highly skilled AI trained in language understanding and writing improvement. I would like you to read the text delimited by triple quotes below and make improvements to it. Aim to retain the original meaning and structure, keeping similar character length and format, for a coherent and readable experience. Maintain professionalism and clarity in your response.
        Only give me the output and nothing else. Do not wrap responses in quotes.No fillers. Respond in the the same language(in other words don't change the language).`,
    }),
  },
  fixError: {
    icon: <CheckCircleFill style={{ ...commonStyle }} />,
    label: 'Fix Error',
    genPrompt: createGenPrompt({
      message: `You are an advanced AI trained in language comprehension and composition. Examine the text enclosed by triple quotes to ensure grammatical accuracy and improve sentence flow. Preserve all correctly used words, while maintaining the original structure. Provide only the revised text without additional commentary. Do not use quotes around your response. Respond in the same language as the input. Avoid fillers. If a word or phrase is already correct, do not alter it. The text for review is provided below within triple quotes:`,
    }),
  },
  assistant: {
    icon: <AspectRatioFill style={{ ...commonStyle }} />,
    label: 'Elaborate',
    genPrompt: createGenPrompt({
      message: `You are a highly skilled AI trained to answer any coding questions. Please read the text delimited by triple quotes and provide a comprehensive solution. Use your trained knowledge to correctly answer the coding question. Provide the solution in Java unless another programming language is explicitly specified in the prompt. Explain the approach and include comments in the code to clarify parts of the code. State the time complexity at the end. Cross-check your answer multiple times to ensure accuracy and provide a clear, direct response.`,
    }),
  },
  code: {
    icon: <AspectRatio style={{ ...commonStyle }} />,
    label: 'Expand',
    genPrompt: createGenPrompt({
      message:
        'You are a highly skilled AI trained to answer any coding questions. Please read the text delimited by triple quotes and provide a comprehensive solution. Use your trained knowledge to correctly answer the coding question. Provide the solution in Java unless another programming language is explicitly specified in the prompt. Explain the approach and include comments in the code to clarify parts of the code. State the time complexity at the end. Cross-check your answer multiple times to ensure accuracy and provide a clear, direct response.',
    }),
  },
  answer: {
    icon: <QuestionSquare style={{ ...commonStyle }} />,
    label: 'Simplify',
    genPrompt: createGenPrompt({
      message: `You are a highly skilled AI trained to answer any questions. I would like you to read the text delimited by triple quotes and answer the question. Access your trained knowledge or internet resources to correctly answer the question. Cross-check your answer and provide a comprehensive response. Provide a clear response that addresses the question directly. Do not wrap responses in quotes. Respond in the same language variety or dialect of the given text.`,
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
      message: `You are a highly skilled AI trained to answer any coding questions. Please read the text delimited by triple quotes, which includes a coding solution or pseudocode. Provide an alternative approach in Java that improves the time complexity or space complexity of the given solution. Explain your approach thoroughly and include comments in the code to clarify parts of the code. State the time complexity and space complexity at the end. Cross-check your answer multiple times to ensure accuracy and provide a clear, direct response. 
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
      message: `You are a highly skilled AI trained to answer any software engineering questions. Please read the text delimited by triple quotes, which includes a low-level design (LLD) or high-level design (HLD) system design prompt. Provide a comprehensive solution acting as a senior software engineer. Break down your answer into a step-by-step explanation, detailing individual components and their interactions. Include diagrams or code snippets if necessary to illustrate key points. Explain the design choices, trade-offs, and considerations for scalability, reliability, and maintainability. Ensure your response is clear, thorough, and addresses all aspects of the given prompt. Additionally, answer as if you are in an interview, demonstrating your expertise, thought process, and communication skills.
       Text to perform task is given in triple quotes below:`,
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
}
