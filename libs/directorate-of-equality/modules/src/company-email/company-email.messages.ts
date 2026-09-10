import type { ErrorMessage } from '../company/company.messages'

const ONE_MB = 1024 * 1024

/**
 * Error messages for the company-email module. Same shape and rules as
 * `companyMessages` — English `message` for logs, Icelandic `translatedMessage`
 * forwarded to the admin UI for direct display.
 */
export const companyEmailMessages = {
  notFound: (id: string): ErrorMessage => ({
    message: `Company email "${id}" not found`,
    translatedMessage: 'Tölvupósturinn fannst ekki',
  }),

  /**
   * Both branches of the exclusive choice share one message on purpose: from the
   * admin's side there is one rule — a send is addressed either to named
   * companies or to a filter — and splitting it into "you gave both" and "you
   * gave neither" would describe the same misuse twice.
   */
  recipientsNotSpecified: (): ErrorMessage => ({
    message:
      'Exactly one of `companyIds` or `filter` must be provided when sending a company email',
    translatedMessage: 'Velja þarf viðtakendur áður en hægt er að senda',
  }),

  noRecipients: (): ErrorMessage => ({
    message: 'No companies matched the requested recipients',
    translatedMessage: 'Engin fyrirtæki fundust sem hægt er að senda á',
  }),

  attachmentsTooLarge: (maxBytes: number): ErrorMessage => ({
    message: `Attachments exceed the ${maxBytes / ONE_MB}MB total limit`,
    translatedMessage: `Viðhengi mega samtals ekki vera stærri en ${maxBytes / ONE_MB} MB`,
  }),

  tooManyAttachments: (max: number): ErrorMessage => ({
    message: `At most ${max} attachments are allowed on one message`,
    translatedMessage: `Hámark ${max} viðhengi eru leyfð`,
  }),

  attachmentUnreadable: (filename: string): ErrorMessage => ({
    message: `Staged attachment "${filename}" could not be read`,
    translatedMessage: `Ekki tókst að lesa viðhengið „${filename}“`,
  }),
}
