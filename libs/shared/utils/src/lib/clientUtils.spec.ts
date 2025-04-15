import { ICELANDIC_ALPHABET, sortAlphabetically } from './clientUtils'

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
    })
  })
})
