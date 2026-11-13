import type { ErrorMessage } from '../company/company.messages'

/**
 * Error messages for the notice-issues module. Same shape as `companyMessages`:
 * English `message` for logs, Icelandic `translatedMessage` shown to the admin,
 * so a refused act says why and what to do next.
 */
export const noticeIssuesMessages = {
  noticeNotFound: (id: string): ErrorMessage => ({
    message: `Notice ${id} not found`,
    translatedMessage: 'Tilkynningin fannst ekki',
  }),

  noticeNotFailed: (id: string, status: string): ErrorMessage => ({
    message: `Notice ${id} is ${status}; only a FAILED notice can be retried`,
    translatedMessage:
      'Aðeins er hægt að senda aftur tilkynningu sem komst ekki til skila. Endurhladdu síðuna.',
  }),

  deliveryNotFound: (id: string): ErrorMessage => ({
    message: `Mailbox delivery ${id} not found`,
    translatedMessage: 'Sendingin í pósthólf fannst ekki',
  }),

  deliveryInProgress: (id: string): ErrorMessage => ({
    message: `Mailbox delivery ${id} is in progress; try again in a few minutes`,
    translatedMessage:
      'Sendingin er í vinnslu núna. Reyndu aftur eftir nokkrar mínútur.',
  }),

  deliveryNeedsReconciling: (id: string): ErrorMessage => ({
    message: `Mailbox delivery ${id} may already have reached One; reconcile it against One first`,
    translatedMessage:
      'Bréfið gæti þegar hafa farið í pósthólfið. Staðfestu stöðuna í One fyrst.',
  }),

  deliveryNeedsNoReconciling: (id: string, status: string): ErrorMessage => ({
    message: `Mailbox delivery ${id} is ${status} and needs no reconciling`,
    translatedMessage:
      'Það þarf ekki að staðfesta stöðu þessarar sendingar. Endurhladdu síðuna.',
  }),

  documentIdRequired: (id: string): ErrorMessage => ({
    message: `Mailbox delivery ${id} has no document id; give the document's ItemID from One`,
    translatedMessage:
      'Sláðu inn auðkenni skjalsins í One til að merkja það sent.',
  }),

  sentConfirmedByOne: (id: string): ErrorMessage => ({
    message: `One confirmed mailbox delivery ${id} as sent; reconcile it as SENT`,
    translatedMessage:
      'One staðfesti að bréfið var sent. Merktu það sent í staðinn.',
  }),

  deliveryChanged: (id: string): ErrorMessage => ({
    message: `Mailbox delivery ${id} changed while it was being updated; reload and check again`,
    translatedMessage:
      'Sendingin breyttist á meðan. Endurhladdu síðuna og athugaðu stöðuna aftur.',
  }),

  noticeChanged: (id: string): ErrorMessage => ({
    message: `Notice ${id} changed while it was being retried; reload and check again`,
    translatedMessage:
      'Tilkynningin breyttist á meðan. Endurhladdu síðuna og athugaðu stöðuna aftur.',
  }),
}
