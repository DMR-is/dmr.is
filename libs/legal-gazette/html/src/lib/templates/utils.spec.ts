import { getDivisionEndingBankruptcyTemplate } from './division-ending-bankruptcy'
import { getRecallBankruptcyTemplate } from './recall-bankruptcy'
import { formatDate, parseAndFormatDate } from './utils'

/**
 * The uskurdardagur is a calendar day. It used to be formatted in the timezone
 * of whichever process rendered it, so the API container and the reader's
 * browser disagreed by a day and an Innkollun and its Skiptalok could name two
 * different ruling dates. These pin the rendering to Atlantic/Reykjavik.
 */
describe('formatDate', () => {
  const judgementDate = new Date('2026-05-06T00:00:00.000Z')

  it('renders a UTC midnight instant as the same calendar day', () => {
    expect(formatDate(judgementDate)[0]).toBe('6. maí 2026')
  })

  it('renders an ISO string the same way it renders a Date', () => {
    expect(formatDate(judgementDate.toISOString())).toEqual(
      formatDate(judgementDate),
    )
  })

  it('renders the same day whatever time of day the instant carries', () => {
    expect(formatDate(new Date('2026-05-06T23:30:00.000Z'))[0]).toBe(
      '6. maí 2026',
    )
  })

  it.each([
    ['', '', ''],
    ['not a date', '', ''],
  ])('returns empty strings for %p', (input) => {
    expect(formatDate(input)).toEqual(['', '', ''])
  })

  it('returns empty strings for a nullish date', () => {
    expect(parseAndFormatDate(undefined)).toEqual(['', '', ''])
    expect(parseAndFormatDate(null)).toEqual(['', '', ''])
  })
})

describe('advert templates', () => {
  const judgementDate = new Date('2026-05-06T00:00:00.000Z')

  it('names the same ruling date in the Innkollun and in the Skiptalok', () => {
    const recall = getRecallBankruptcyTemplate({
      courtDistrict: 'Héraðsdóms Reykjavíkur',
      judgementDate,
    })

    const divisionEnding = getDivisionEndingBankruptcyTemplate({
      courtDistrict: 'Héraðsdóms Reykjavíkur',
      judgementDate: judgementDate.toISOString(),
      endingDate: new Date('2026-07-30T00:00:00.000Z').toISOString(),
    })

    expect(recall).toContain('uppkveðnum 6. maí 2026')
    expect(divisionEnding).toContain('uppkveðnum 6. maí 2026')
    expect(divisionEnding).toContain('Skiptum var lokið þann 30. júlí 2026')
  })
})
