import type { ErrorMessage } from '../company/company.messages'

/**
 * Error messages for the user module, in the shape `company.messages.ts`
 * describes: an English `message` for logs and `details[]`, and an Icelandic
 * `translatedMessage` the web shows as is.
 */
export const userMessages = {
  notAPerson: (): ErrorMessage => ({
    message: 'Users are people; this kennitala belongs to a legal entity',
    translatedMessage:
      'Kennitalan er ekki kennitala einstaklings. Notandi þarf að vera einstaklingur.',
  }),
  registryPersonNotFound: (nationalId: string): ErrorMessage => ({
    message: `No person found in national registry for "${nationalId}"`,
    translatedMessage: 'Engin skráning fannst í þjóðskrá fyrir þessa kennitölu',
  }),
}
