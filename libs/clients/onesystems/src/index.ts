/**
 * Public surface of `@dmr.is/clients-onesystems`.
 *
 * The concrete `OneSystemsService` class is deliberately absent: consumers
 * import `OneSystemsModule` and inject the `IOneSystemsService` token, which is
 * what binds the two. The generated SDK is not re-exported either, so every
 * call goes through the service's token handling and response checks.
 */

export { OneSystemsModule } from './lib/onesystems.module'
export {
  IOneSystemsService,
  type OneSystemsCloseCaseInput,
  type OneSystemsCloseCaseResult,
  type OneSystemsCreateCaseInput,
  type OneSystemsCreateCaseResult,
  type OneSystemsCreateDocumentInput,
  type OneSystemsCreateDocumentResult,
  type OneSystemsSendDocToIslandIsInput,
  type OneSystemsSendDocToIslandIsResult,
} from './lib/onesystems.service.interface'
export {
  ONESYSTEMS_REQUEST_TIMEOUT_MS,
  ONESYSTEMS_DOCUMENT_TIMEOUT_MS,
  oneSystemsTimeoutMs,
} from './lib/onesystems.config'
export {
  isDefinitiveOneSystemsFailure,
  isOneSystemsError,
  ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS,
  OneSystemsError,
  type OneSystemsErrorJson,
  type OneSystemsErrorReason,
  type OneSystemsNonIdempotentOperation,
  type OneSystemsOperation,
  toLoggableErrorNumber,
} from './lib/onesystems.errors'
