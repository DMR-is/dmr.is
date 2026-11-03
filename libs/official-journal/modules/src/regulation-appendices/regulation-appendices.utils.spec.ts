import {
  groupSerialsByYear,
  parsePublicationNumbers,
} from './regulation-appendices.utils'

describe('parsePublicationNumbers', () => {
  it('normalizes leading zeros and whitespace to number/year', () => {
    expect(parsePublicationNumbers(['01000 / 2026', ' 7/2025 '])).toEqual({
      ok: true,
      value: [
        { full: '1000/2026', number: 1000, year: 2026 },
        { full: '7/2025', number: 7, year: 2025 },
      ],
    })
  })

  it('collapses duplicates to their first position', () => {
    const result = parsePublicationNumbers([
      '1000/2026',
      '5/2026',
      '01000/2026',
    ])

    expect(result.ok && result.value.map((n) => n.full)).toEqual([
      '1000/2026',
      '5/2026',
    ])
  })

  it.each([
    ['a bare serial', '1000'],
    ['a two-digit year', '1000/26'],
    ['text', 'reglugerð'],
    ['an empty string', ''],
    ['a serial past five digits', '123456/2026'],
    ['an 11-digit case number with a year', '20260101001/2026'],
  ])('rejects %s', (_, value) => {
    expect(parsePublicationNumbers(['1000/2026', value])).toEqual({
      ok: false,
      invalid: [value],
    })
  })

  it('reports every invalid entry, not just the first', () => {
    expect(parsePublicationNumbers(['x', '1000/2026', 'y'])).toEqual({
      ok: false,
      invalid: ['x', 'y'],
    })
  })
})

describe('groupSerialsByYear', () => {
  it('groups serial numbers under their year', () => {
    const grouped = groupSerialsByYear([
      { full: '1/2025', number: 1, year: 2025 },
      { full: '2/2026', number: 2, year: 2026 },
      { full: '3/2025', number: 3, year: 2025 },
    ])

    expect([...grouped.entries()]).toEqual([
      [2025, [1, 3]],
      [2026, [2]],
    ])
  })
})
