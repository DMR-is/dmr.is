import { getDoEClient } from './createClient'

/**
 * The token is required rather than defaulted from the session: the optional
 * form silently sent `Authorization: Bearer undefined` when a session had no
 * id token, which reads as an auth bug at the API rather than a missing
 * credential here. createTRPCContext already rejects such a session, so the
 * caller always has a real token to pass.
 */
export async function getServerClient(token: string) {
  return getDoEClient(token)
}
