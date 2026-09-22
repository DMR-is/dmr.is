import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { SubmitEqualityReportDto } from './submit-equality-report.dto'
import { SubmitSalaryReportDto } from './submit-salary-report.dto'

/**
 * `providerId` is the caller's own submission id, and it used to be
 * `@ApiUUID()` — which meant a vendor whose ids are not UUIDs had to keep a
 * mapping table purely to satisfy a format we never read. The guide even
 * published `2026-Q1-042` as the example and the API rejected it.
 *
 * These pin the loosening so it cannot be "corrected" back: the safety on this
 * field is the `(provider_type, provider_id)` uniqueness and, on the partner
 * channel, its kennitala namespacing — never the shape. What remains enforced is
 * that the value exists, is bounded because it reaches a unique index, and is
 * trimmed because it is also an idempotency key.
 */
const providerIdConstraints = <T extends object>(
  cls: new () => T,
  value: unknown,
): string[] => {
  const errors = validateSync(plainToInstance(cls, { providerId: value }))
  const own = errors.find((e) => e.property === 'providerId')
  return Object.values(own?.constraints ?? {})
}

/** What the value becomes after `@ApiProviderId`'s transform. */
const providerIdAfterTransform = <T extends object>(
  cls: new () => T,
  value: unknown,
): unknown =>
  (plainToInstance(cls, { providerId: value }) as { providerId?: unknown })
    .providerId

describe.each([
  ['SubmitSalaryReportDto', SubmitSalaryReportDto],
  ['SubmitEqualityReportDto', SubmitEqualityReportDto],
] as const)('%s.providerId', (_name, cls) => {
  it.each([
    ['a UUID, which island.is sends', 'f0e1d2c3-b4a5-4968-8778-6a5b4c3d2e1f'],
    ['a vendor scheme the guide advertises', '2026-Q1-042'],
    ['an id containing a colon, which the namespace strip tolerates', 'a:b'],
    ['a single character', '1'],
  ])('accepts %s', (_case, value) => {
    expect(providerIdConstraints(cls, value)).toEqual([])
  })

  it('accepts exactly the bound', () => {
    expect(providerIdConstraints(cls, 'x'.repeat(256))).toEqual([])
  })

  /**
   * Not cosmetic. `providerId` is the idempotency key, so untrimmed `'abc'` and
   * `'abc '` are two keys and a retry differing only by whitespace files a
   * second report — the loss the `replayed` flag exists to make visible.
   * `@ApiUUID()` made this unreachable for free; a bounded string has to say so.
   */
  describe('trimming', () => {
    it.each([
      ['leading', ' 2026-Q1-042'],
      ['trailing', '2026-Q1-042 '],
      ['both', '  2026-Q1-042\t'],
    ])('collapses %s whitespace to the same key', (_case, value) => {
      expect(providerIdAfterTransform(cls, value)).toBe('2026-Q1-042')
      expect(providerIdConstraints(cls, value)).toEqual([])
    })

    it('rejects a whitespace-only id, which MinLength(1) alone would admit', () => {
      expect(providerIdConstraints(cls, '   ')).not.toEqual([])
    })

    it('trims before the bound is applied', () => {
      expect(providerIdConstraints(cls, ` ${'x'.repeat(256)} `)).toEqual([])
    })
  })

  it('rejects an empty string — it is the only read handle', () => {
    expect(providerIdConstraints(cls, '')).not.toEqual([])
  })

  it('rejects a value past the bound — it reaches a unique index', () => {
    expect(providerIdConstraints(cls, 'x'.repeat(257))).not.toEqual([])
  })

  it('rejects a non-string', () => {
    expect(providerIdConstraints(cls, 42)).not.toEqual([])
  })
})
