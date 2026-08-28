import type { ErrorMessage } from '../company/company.messages'

/**
 * Error messages for the company-comment module. See `company.messages.ts` for
 * the message-shape contract and usage notes.
 */
export const companyCommentMessages = {
  bodyEmpty: {
    message: 'Comment body cannot be empty',
    translatedMessage: 'Athugasemd má ekki vera tóm',
  } satisfies ErrorMessage,
  notFound: (id: string): ErrorMessage => ({
    message: `Comment "${id}" not found`,
    translatedMessage: 'Athugasemd fannst ekki',
  }),
} as const
