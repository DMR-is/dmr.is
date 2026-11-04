import { isEffectiveOnOrBeforePublication } from './utils'

describe('isEffectiveOnOrBeforePublication', () => {
  it('is false without a publication date', () => {
    expect(isEffectiveOnOrBeforePublication('2026-05-18', undefined)).toBe(
      false,
    )
  })

  it('is true when the effective date is before publication', () => {
    expect(
      isEffectiveOnOrBeforePublication(
        '2026-05-18',
        '2026-05-19T00:00:00.000Z',
      ),
    ).toBe(true)
  })

  it('is true when the effective date is the publication day', () => {
    expect(
      isEffectiveOnOrBeforePublication(
        '2026-05-19',
        '2026-05-19T00:00:00.000Z',
      ),
    ).toBe(true)
  })

  it('is true when there is no effective date, as it then takes effect on publication', () => {
    expect(
      isEffectiveOnOrBeforePublication(undefined, '2026-05-19T00:00:00.000Z'),
    ).toBe(true)
  })

  it('is false when the effective date is after publication', () => {
    expect(
      isEffectiveOnOrBeforePublication(
        '2026-05-20',
        '2026-05-19T00:00:00.000Z',
      ),
    ).toBe(false)
  })
})
