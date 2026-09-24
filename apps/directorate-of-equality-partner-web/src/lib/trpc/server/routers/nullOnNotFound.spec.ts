import { nullOnNotFound } from './nullOnNotFound'

// The overview renders through fetchQueryWithHandler, which turns any 404 into
// notFound() and replaces the whole page. So a 404 that means "not in the
// register" or "not a provider" must become null here — and nothing else may.
//
// Fixtures are the body HttpExceptionFilter actually sends, which the bound SDK
// throws as-is.
describe('nullOnNotFound', () => {
  const failWith = (body: unknown) => () =>
    nullOnNotFound(async () => {
      throw body
    })

  it('passes a successful response through', async () => {
    await expect(nullOnNotFound(async () => ({ id: 'x' }))).resolves.toEqual({
      id: 'x',
    })
  })

  it('answers the company-not-in-register 404 with null', async () => {
    await expect(
      failWith({
        statusCode: 404,
        name: 'NotFound',
        message: 'Not found',
        details: ['Company with national id "0000000000" not found'],
        translatedMessage: 'Fyrirtækið fannst ekki',
      })(),
    ).resolves.toBeNull()
  })

  it('answers the not-a-provider 404 with null', async () => {
    await expect(
      failWith({
        statusCode: 404,
        name: 'NotFound',
        message: 'Not found',
        details: ['This organisation is not an approved provider'],
        translatedMessage: 'Þessi aðili er ekki samþykktur þjónustuaðili',
      })(),
    ).resolves.toBeNull()
  })

  it('rethrows a route-not-found 404, which carries no translatedMessage', async () => {
    // What a wrong base path or a web deployed ahead of its API produces. As
    // null it would tell a registered employer it is not on file.
    const routeNotFound = {
      statusCode: 404,
      name: 'NotFound',
      message: 'Not found',
      details: ['Cannot GET /api/v1/application/company'],
    }

    await expect(failWith(routeNotFound)()).rejects.toBe(routeNotFound)
  })

  it('rethrows any other API error', async () => {
    const forbidden = {
      statusCode: 403,
      name: 'Forbidden',
      message: 'Forbidden',
      translatedMessage: 'Aðgangi hafnað',
    }

    await expect(failWith(forbidden)()).rejects.toBe(forbidden)
  })

  it('rethrows a network failure that carries no status', async () => {
    const failure = new TypeError('fetch failed')

    await expect(failWith(failure)()).rejects.toBe(failure)
  })
})
