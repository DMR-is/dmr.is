import { ApiKeyKindEnum } from '@dmr.is/doe-shared'

import { ApiKeyThrottlerGuard } from './api-key-throttler.guard'

/**
 * keyIds are unique per key table, not across the two. The tracker names the
 * kind as well, so a company key and a vendor key that happened to share a
 * keyId could never share a bucket — the same collision the verify lookup and
 * its touch interval are keyed against.
 */
describe('ApiKeyThrottlerGuard tracker', () => {
  const guard = Object.create(ApiKeyThrottlerGuard.prototype) as {
    getTracker(req: unknown): Promise<string>
  }

  it('keys the bucket by kind and keyId', async () => {
    await expect(
      guard.getTracker({
        apiKeyContext: { kind: ApiKeyKindEnum.COMPANY, keyId: 'aaaa' },
      }),
    ).resolves.toBe('key:COMPANY:aaaa')
  })

  it('gives two kinds with the same keyId separate buckets', async () => {
    const company = await guard.getTracker({
      apiKeyContext: { kind: ApiKeyKindEnum.COMPANY, keyId: 'aaaa' },
    })
    const vendor = await guard.getTracker({
      apiKeyContext: { kind: ApiKeyKindEnum.PARTNER_CLIENT, keyId: 'aaaa' },
    })

    expect(company).not.toBe(vendor)
  })
})
