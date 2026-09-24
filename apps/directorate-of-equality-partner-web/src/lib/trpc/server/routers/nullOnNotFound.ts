type ApiErrorBody = { statusCode?: unknown; translatedMessage?: unknown }

/**
 * Turns the API's `404` into `null` for the two lookups where "not there" is an
 * answer rather than a failure:
 *
 * - `getApplicationCompany` 404s when the signed-in kennitala has no row in the
 *   employer register, and
 * - `getApplicationPartnerClient` 404s for anyone Jafnréttisstofa has not
 *   approved as a provider — which is how this app decides whether to show the
 *   provider screens at all.
 *
 * Left as errors, either would reach `fetchQueryWithHandler`, which answers a
 * 404 with `notFound()` and replaces the whole overview with the 404 page.
 *
 * ⚠️ Only a 404 that carries a `translatedMessage`. Both intended answers do
 * (`companyMessages.notFoundByNationalId`, `partnerClientMessages.notAProvider`);
 * Nest's own route-not-found goes through the same filter without one. Treating
 * that as `null` too would let a wrong `DOE_API_BASE_PATH`, or a web deployed
 * ahead of its API, quietly tell a registered employer it is not on file.
 *
 * The bound SDK throws the parsed error body. Anything else is rethrown.
 */
export const nullOnNotFound = async <T>(
  request: () => Promise<T>,
): Promise<T | null> => {
  try {
    return await request()
  } catch (error) {
    const body = error as ApiErrorBody | null

    if (
      body !== null &&
      typeof body === 'object' &&
      body.statusCode === 404 &&
      typeof body.translatedMessage === 'string'
    ) {
      return null
    }

    throw error
  }
}
