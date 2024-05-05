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

    let fullMessage = isTranslation
      ? `Translate the following into ${preferredLanguage} and only show me the translated content`
      : message
    if (enableBidirectional) {
      fullMessage += `. If it is already in ${preferredLanguage}, translate it into English and only show me the translated content`
    }
    const prefix = includeLanguagePrefix ? `Reply in ${preferredLanguage}.` : ''
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
        Only give me the output and nothing else. Do not wrap responses in quotes. Respond in the the same language(in other words don't change the language).`,
    }),
  },
  assistant: {
    icon: <PersonHeart style={{ ...commonStyle }} />,
    label: 'Assistant',
    genPrompt: createGenPrompt({
      message: `Act as a Career Assistant for Niraj Chaudhari, a highly skilled AI trained in language understanding and writing improvement. Your task is to read the provided Prompt text delimited by triple quotes and offer tailored responses based on Niraj's professional and academic profile. Incorporate relevant details from his 3D portfolio website at http://nirajrchaudhari.github.io/ when necessary to highlight his skills in response to queries. Address him directly as if you are conversing with Niraj, using specific details from his resume to provide comprehensive and relevant answers. Access extra information about topic mentioned in the prompt from the web if needed.

      Resume Background of Niraj:
      Technical Skills:
      - Programming Languages: Java, Python, JavaScript, C++, C#, TypeScript
      - Frameworks: Spring Boot, Django, .NET
      - Frontend: Angular, HTML, CSS, ReactJS
      - Databases: MySQL, MongoDB, Firebase, Redis, Oracle, PostgreSQL
      - Technologies: GitHub, Jenkins, Docker, Kubernetes, Pytorch, XML, OpenCV, Kafka, AWS, Android, Google Cloud
      
      Experience:
      - Software Developer at USC: Developed Node.js backend REST APIs for Health AI Lab, reduced response latency by 18%, integrated a GBM machine learning model, revamped Angular frontend with a 26% user engagement increase, deployed on Google Cloud, and set up Prometheus and Grafana monitoring.
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
      
      
      Answer the below prompt, when responding as Niraj, tailor your answers to reflect the extensive and specific details of his background and achievements, utilizing his website to enhance your responses where applicable.Only give me the output and nothing else, no filler text. Do not wrap responses in quotes. 
      
      Prompt to answer is given in triple quotes below:`,
      includeLanguagePrefix: true,
    }),
  },
  fixError: {
    icon: <CheckCircleFill style={{ ...commonStyle }} />,
    label: 'Fix Error',
    genPrompt: createGenPrompt({
      message: `You are a highly skilled AI trained in language understanding and writing improvement. I would like you to read the text delimited by triple quotes and make improvements to it. Aim to retain the original meaning and structure, keeping similar character length and format, for a coherent and readable experience. Reorder the sentences and rephrase the text. Keep text relatively consise without loosing any important information.
      Only give me the output and nothing else. Do not wrap responses in quotes. Respond in the the same language(in other words don't change the language).
      Text to perform task is given in triple quotes below:`,
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
      message: `Rewrite the text delimited by triple quotes and output it shorter to be no more than half the number of characters of the original text. Keep the meaning the same. Only give me the output and nothing else.Do not wrap responses in quotes.  Now, using the concepts above, re-write the following text. Respond in the same language variety or dialect of the following text:
      Text to perform task is given in triple quotes below:`,
    }),
  },
  makeLonger: {
    icon: <ArrowsAngleExpand style={{ ...commonStyle }} />,
    label: 'Longer',
    genPrompt: createGenPrompt({
      message: `Rewrite the text delimited by triple quotes and output it longer to be more than twice the number of characters of the original text. Keep the meaning the same. Only give me the output and nothing else. Do not wrap responses in quotes.  Now, using the concepts above, re-write the following text. Respond in the same language variety or dialect of the following text: `,
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
      Only give me the output and nothing else. Do not wrap responses in quotes. Text to perform task is given in triple quotes below:`,
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
