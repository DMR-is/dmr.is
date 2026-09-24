import { nullOnNotFound } from './nullOnNotFound'

// The overview renders through fetchQueryWithHandler, which turns any 404 into
// notFound() and replaces the whole page. So a 404 that means "not in the
// register" or "not a provider" must become null here — and nothing else may.
describe('nullOnNotFound', () => {
  it('passes a successful response through', async () => {
    await expect(nullOnNotFound(async () => ({ id: 'x' }))).resolves.toEqual({
      id: 'x',
    })
  })

  it('answers the API’s 404 body with null', async () => {
    await expect(
      nullOnNotFound(async () => {
        throw { statusCode: 404, message: 'Not Found' }
      }),
    ).resolves.toBeNull()
  })

  it('rethrows any other API error', async () => {
    const forbidden = { statusCode: 403, message: 'Forbidden' }

    await expect(
      nullOnNotFound(async () => {
        throw forbidden
      }),
    ).rejects.toBe(forbidden)
  })

  it('rethrows a network failure that carries no status', async () => {
    const failure = new TypeError('fetch failed')

    await expect(
      nullOnNotFound(async () => {
        throw failure
      }),
    ).rejects.toBe(failure)
  })
})
