import {
  createUrlFromHost,
  ICELANDIC_ALPHABET,
  sortAlphabetically,
} from './clientUtils'
describe('clientUtils', () => {
  describe('sortAlphabetically', () => {
    it('should sort strings alphabetically according to Icelandic locale', () => {
      // Test basic alphabetical sorting
      expect(sortAlphabetically('apple', 'banana')).toBeLessThan(0)
      expect(sortAlphabetically('banana', 'apple')).toBeGreaterThan(0)
      expect(sortAlphabetically('apple', 'apple')).toBe(0)
    })
    it('should handle Icelandic characters correctly', () => {
      // Test Icelandic-specific characters
      expect(sortAlphabetically('á', 'a')).toBeGreaterThan(0)
      expect(sortAlphabetically('æ', 'ö')).toBeLessThan(0)
      expect(sortAlphabetically('þ', 'ð')).toBeGreaterThan(0)
    })
    it('should be case-insensitive', () => {
      // Test case sensitivity
      expect(sortAlphabetically('Apple', 'banana')).toBeLessThan(0)
      expect(sortAlphabetically('apple', 'Banana')).toBeLessThan(0)
      expect(sortAlphabetically('APPLE', 'banana')).toBeLessThan(0)
    })
    it('should handle empty strings', () => {
      // Test empty strings
      expect(sortAlphabetically('', 'a')).toBeLessThan(0)
      expect(sortAlphabetically('a', '')).toBeGreaterThan(0)
      expect(sortAlphabetically('', '')).toBe(0)
    })
    it('should sort according to ICELANDIC_ALPHABET order', () => {
      // Create an array of characters in the order of ICELANDIC_ALPHABET
      const chars = ICELANDIC_ALPHABET.split('')
      // Test that each character comes before the next one in the alphabet
      for (let i = 0; i < chars.length - 1; i++) {
        expect(sortAlphabetically(chars[i], chars[i + 1])).toBeLessThan(0)
      }
    })
    it('should handle mixed Icelandic and non-Icelandic characters', () => {
      // Test mixed character sets
      expect(sortAlphabetically('ár', 'as')).toBeGreaterThan(0) // 'as' comes before 'ár' in Icelandic
      expect(sortAlphabetically('ás', 'at')).toBeGreaterThan(0)
      expect(sortAlphabetically('át', 'au')).toBeGreaterThan(0)
      expect(sortAlphabetically('ás', 'ba')).toBeLessThan(0)
      expect(sortAlphabetically('Ísafjörður', 'Jökulsárlón')).toBeLessThan(0)
      expect(sortAlphabetically('Ísafjörður', 'Hafnarfjörður')).toBeGreaterThan(
        0,
      )
    })
  })
  describe('createUrlFromHost', () => {
    const originalWindow = global.window
    beforeEach(() => {
      global.window = { location: { host: 'example.com' } } as Window &
        typeof globalThis
    })
    afterEach(() => {
      global.window = originalWindow
    })
    describe('logbirtingablad.is domain', () => {
      it('should create auglysendur.logbirtingablad.is from logbirtingablad.is', () => {
        const result = createUrlFromHost(
          'logbirtingablad.is',
          false,
          'auglysendur',
        )
        expect(result).toBe('https://auglysendur.logbirtingablad.is')
      })
      it('should create logbirtingablad.is from auglysendur.logbirtingablad.is', () => {
        const result = createUrlFromHost('auglysendur.logbirtingablad.is', true)
        expect(result).toBe('https://logbirtingablad.is')
      })
      it('should create ritstjorn.logbirtingablad.is from auglysendur.logbirtingablad.is', () => {
        const result = createUrlFromHost(
          'auglysendur.logbirtingablad.is',
          true,
          'ritstjorn',
        )
        expect(result).toBe('https://ritstjorn.logbirtingablad.is')
      })
    })
    describe('stjornartidindi.is domain', () => {
      it('should create api.stjornartidindi.is from ritstjorn.stjornartidindi.is', () => {
        const result = createUrlFromHost(
          'ritstjorn.stjornartidindi.is',
          true,
          'api',
        )
        expect(result).toBe('https://api.stjornartidindi.is')
      })
      it('should create api.stjornartidindi.is from stjornartidindi.is', () => {
        const result = createUrlFromHost('stjornartidindi.is', false, 'api')
        expect(result).toBe('https://api.stjornartidindi.is')
      })
      it('should create stjornartidindi.is from ritstjorn.stjornartidindi.is', () => {
        const result = createUrlFromHost('ritstjorn.stjornartidindi.is', true)
        expect(result).toBe('https://stjornartidindi.is')
      })
      it('should create ritstjorn.stjornartidindi.is from api.stjornartidindi.is', () => {
        const result = createUrlFromHost(
          'api.stjornartidindi.is',
          true,
          'ritstjorn',
        )
        expect(result).toBe('https://ritstjorn.stjornartidindi.is')
      })
    })
    describe('edge cases', () => {
      it('should return empty string when window.location is not available', () => {
        // @ts-expect-error - intentionally setting location to undefined for test
        global.window = { location: undefined }
        const result = createUrlFromHost(
          'logbirtingablad.is',
          false,
          'auglysendur',
        )
        expect(result).toBe('')
      })
      it('should handle host without subdomain when shouldShift is false', () => {
        const result = createUrlFromHost('logbirtingablad.is', false)
        expect(result).toBe('https://logbirtingablad.is')
      })
      it('should handle shifting without adding new subdomain', () => {
        const result = createUrlFromHost('sub.logbirtingablad.is', true)
        expect(result).toBe('https://logbirtingablad.is')
      })
    })
  })
})
