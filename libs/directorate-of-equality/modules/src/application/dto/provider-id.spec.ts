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
 * field is the `(provider_type, provider_id)` uniqueness and the partner
 * channel's kennitala namespacing, never the shape. What remains enforced is
 * only that the value exists and is bounded, because it reaches a unique index.
 */
const providerIdConstraints = <T extends object>(
  cls: new () => T,
  value: unknown,
): string[] => {
  const errors = validateSync(plainToInstance(cls, { providerId: value }))
  const own = errors.find((e) => e.property === 'providerId')
  return Object.values(own?.constraints ?? {})
}

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
