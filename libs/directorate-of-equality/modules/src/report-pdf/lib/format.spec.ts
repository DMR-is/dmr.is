import { GenderEnum } from '../../report/models/report.enums'
import {
  escapeHtml,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  genderLabel,
  orDash,
} from './format'

describe('report-pdf format helpers', () => {
  describe('formatCurrency', () => {
    it('formats with is-IS dot grouping and a kr. suffix', () => {
      expect(formatCurrency(1065400)).toBe('1.065.400 kr.')
    })

    it('returns an em dash for nullish values', () => {
      expect(formatCurrency(null)).toBe('—')
      expect(formatCurrency(undefined)).toBe('—')
    })
  })

  describe('formatNumber', () => {
    it('groups thousands with dots and no suffix', () => {
      expect(formatNumber(25000)).toBe('25.000')
    })

    /*
     * ⚠️ The case the old `.replaceAll(',', '.')` corrupted, and the reason the
     * suite could not see it: every other assertion here is an integer, where
     * the substitution was a no-op. In is-IS the comma IS the decimal
     * separator, so `420,5` came out `420.5` and `1.234,56` came out
     * `1.234.56`. `Stig` is DECIMAL(6,2) and the FTE counts are fractional, so
     * both shapes print in a real report.
     */
    it('separates the decimal with a comma, and still groups with dots', () => {
      expect(formatNumber(420.5)).toBe('420,5')
      expect(formatNumber(1234.56)).toBe('1.234,56')
      expect(formatNumber(0.5)).toBe('0,5')
    })

    it('returns an em dash for nullish values', () => {
      expect(formatNumber(null)).toBe('—')
    })
  })

  describe('formatPercent', () => {
    it('uses a comma decimal and optional sign', () => {
      expect(formatPercent(6.33, { signed: true })).toBe('+6,3%')
      expect(formatPercent(-12, { signed: true })).toBe('-12,0%')
      expect(formatPercent(6.33)).toBe('6,3%')
    })

    it('returns an em dash for nullish values', () => {
      expect(formatPercent(null)).toBe('—')
    })
  })

  describe('formatDate', () => {
    it('formats as zero-padded dd.MM.yyyy', () => {
      // Local-time constructor keeps the assertion timezone-independent.
      expect(formatDate(new Date(2026, 4, 21))).toBe('21.05.2026')
      expect(formatDate(new Date(2026, 0, 9))).toBe('09.01.2026')
    })

    it('splits a DATEONLY string instead of parsing it as an instant', () => {
      // `new Date('2027-03-01')` is UTC midnight; reading local parts off it
      // yields 28.02.2027 west of UTC. `remedy_date` is DATEONLY, so the
      // string arm must never take that path. Invisible from Iceland (UTC+0),
      // which is why it is asserted rather than eyeballed.
      expect(formatDate('2027-03-01')).toBe('01.03.2027')
      expect(formatDate('2026-01-09')).toBe('09.01.2026')
    })

    it('keeps the instant path for values carrying a time', () => {
      expect(formatDate('2026-05-21T22:30:00.000Z')).toBe(
        formatDate(new Date('2026-05-21T22:30:00.000Z')),
      )
    })

    it('handles invalid and nullish input', () => {
      expect(formatDate('not-a-date')).toBe('—')
      expect(formatDate(null)).toBe('—')
      expect(formatDate(undefined)).toBe('—')
    })
  })

  describe('genderLabel', () => {
    it('maps gender enums to Icelandic labels', () => {
      expect(genderLabel(GenderEnum.MALE)).toBe('Karl')
      expect(genderLabel(GenderEnum.FEMALE)).toBe('Kona')
      expect(genderLabel(GenderEnum.NEUTRAL)).toBe('Hlutlaust')
      expect(genderLabel(null)).toBe('—')
    })
  })

  describe('escapeHtml', () => {
    it('escapes HTML-significant characters', () => {
      expect(escapeHtml('<script>"&\'')).toBe(
        '&lt;script&gt;&quot;&amp;&#39;',
      )
    })
  })

  describe('orDash', () => {
    it('escapes non-empty values and dashes blanks', () => {
      expect(orDash('  Blámi & Co  ')).toBe('Blámi &amp; Co')
      expect(orDash('   ')).toBe('—')
      expect(orDash(null)).toBe('—')
    })
  })
})
