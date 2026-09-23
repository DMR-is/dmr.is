import { ApiKeyKindEnum } from '@dmr.is/doe-shared'

import {
  COMPANY_KEY_LIMIT_PER_HOUR,
  PARTNER_CLIENT_KEY_LIMIT_PER_HOUR,
  perKeyLimit,
} from './throttlers'

const contextFor = (apiKeyContext: unknown) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ apiKeyContext }) }),
  }) as never

/**
 * One bucket, two limits. A vendor key spends its allowance across its whole
 * book, so it gets more; everything else keeps the company figure the guide
 * publishes.
 */
describe('perKeyLimit', () => {
  it('gives a vendor client key 10 000 an hour', () => {
    expect(
      perKeyLimit(contextFor({ kind: ApiKeyKindEnum.PARTNER_CLIENT })),
    ).toBe(10000)
    expect(PARTNER_CLIENT_KEY_LIMIT_PER_HOUR).toBe(10000)
  })

  it('keeps a company key at 5 000 an hour', () => {
    expect(perKeyLimit(contextFor({ kind: ApiKeyKindEnum.COMPANY }))).toBe(
      COMPANY_KEY_LIMIT_PER_HOUR,
    )
    expect(COMPANY_KEY_LIMIT_PER_HOUR).toBe(5000)
  })

  it('falls back to the lower limit when there is no key on the request', () => {
    expect(perKeyLimit(contextFor(undefined))).toBe(COMPANY_KEY_LIMIT_PER_HOUR)
  })
})
