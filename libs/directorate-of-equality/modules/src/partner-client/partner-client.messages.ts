import type { ErrorMessage } from '../company/company.messages'

/**
 * Error messages for vendor clients and their keys. Same shape and rules as
 * `companyMessages` — English `message` for logs, Icelandic
 * `translatedMessage` forwarded to the admin UI for direct display.
 */
export const partnerClientMessages = {
  invalidKennitala: (): ErrorMessage => ({
    message: 'nationalId is not a valid kennitala',
    translatedMessage: 'Kennitalan er ekki gild',
  }),

  blankName: (): ErrorMessage => ({
    message: 'name must not be blank',
    translatedMessage: 'Heiti þjónustuaðila má ekki vera autt',
  }),

  duplicateClient: (): ErrorMessage => ({
    message: 'This kennitala is already an active partner client',
    translatedMessage:
      'Þessi kennitala er þegar skráð sem virkur þjónustuaðili',
  }),

  clientNotFound: (): ErrorMessage => ({
    message: 'Partner client not found',
    translatedMessage: 'Þjónustuaðilinn fannst ekki',
  }),

  clientRevoked: (): ErrorMessage => ({
    message: 'This partner client has been revoked and cannot be issued keys',
    translatedMessage:
      'Þjónustuaðilinn hefur verið afturkallaður og getur ekki fengið nýja lykla',
  }),

  keyNotFound: (): ErrorMessage => ({
    message: 'Partner client key not found',
    translatedMessage: 'Aðgangslykillinn fannst ekki',
  }),

  keyCeiling: (max: number): ErrorMessage => ({
    message: `A partner client may hold at most ${max} usable keys — revoke one before issuing another`,
    translatedMessage: `Þjónustuaðili má hafa að hámarki ${max} virka lykla — afturkallaðu einn áður en nýr er búinn til`,
  }),
}
