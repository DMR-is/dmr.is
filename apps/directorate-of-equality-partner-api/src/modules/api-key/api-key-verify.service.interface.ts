import { ApiKeyContext } from './api-key.types'

export interface IApiKeyVerifyService {
  /**
   * Resolves a presented credential to the caller it authenticates, or throws
   * `UnauthorizedException`.
   *
   * Every rejection is the same exception with the same message, whatever the
   * cause — malformed, unknown, wrong secret, revoked, expired. The caller has
   * no business distinguishing "no such key" from "wrong secret", and a
   * distinguishable error is an oracle for probing which keyIds exist.
   */
  verify(presented: string): Promise<ApiKeyContext>
}

export const IApiKeyVerifyService = Symbol('IApiKeyVerifyService')
