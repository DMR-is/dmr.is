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
 * The bound SDK throws the parsed error body, which carries `statusCode`.
 * Anything else is rethrown untouched.
 */
export const nullOnNotFound = async <T>(
  request: () => Promise<T>,
): Promise<T | null> => {
  try {
    return await request()
  } catch (error) {
    if (
      error !== null &&
      typeof error === 'object' &&
      (error as { statusCode?: unknown }).statusCode === 404
    ) {
      return null
    }

    throw error
  }
}
