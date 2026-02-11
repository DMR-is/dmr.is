import lodashOmit from 'lodash/omit'

import { omit } from './omit'

describe('omit', () => {
  describe('basic usage (parity with lodash)', () => {
    const cases: Array<[string, Record<string, unknown>, string[]]> = [
      ['single key', { a: 1, b: 2, c: 3 }, ['a']],
      ['multiple keys', { a: 1, b: '2', c: 3 }, ['a', 'c']],
      ['all keys', { a: 1, b: 2 }, ['a', 'b']],
      ['no keys', { a: 1, b: 2 }, []],
      ['non-existent keys', { a: 1, b: 2 }, ['c', 'd']],
      ['mix of existing and non-existent', { a: 1, b: 2, c: 3 }, ['a', 'z']],
    ]

    it.each(cases)('%s', (_name, obj, keys) => {
      expect(omit(obj, keys)).toStrictEqual(lodashOmit(obj, keys))
    })
  })

  describe('value types (parity with lodash)', () => {
    it('should preserve various value types', () => {
      const obj = {
        str: 'hello',
        num: 42,
        bool: true,
        nil: null,
        undef: undefined,
        arr: [1, 2, 3],
        nested: { a: 1 },
      }
      const keys = ['str', 'bool'] as const

      expect(omit(obj, keys)).toStrictEqual(lodashOmit(obj, [...keys]))
    })

    it('should handle object with numeric string keys', () => {
      const obj = { '0': 'a', '1': 'b', '2': 'c' }
      expect(omit(obj, ['0', '2'])).toStrictEqual(lodashOmit(obj, ['0', '2']))
    })
  })

  describe('immutability', () => {
    it('should not modify the original object', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const original = { ...obj }

      omit(obj, ['a'])

      expect(obj).toStrictEqual(original)
    })

    it('should return a new object reference', () => {
      const obj = { a: 1, b: 2 }
      const result = omit(obj, [])

      expect(result).not.toBe(obj)
      expect(result).toStrictEqual(obj)
    })
  })

  describe('variadic string arguments (parity with lodash)', () => {
    it('should accept a single string key', () => {
      const obj = { a: 1, b: 2, c: 3 }
      expect(omit(obj, 'a')).toStrictEqual(lodashOmit(obj, 'a'))
    })

    it('should accept multiple string keys', () => {
      const obj = { a: 1, b: 2, c: 3 }
      expect(omit(obj, 'a', 'c')).toStrictEqual(lodashOmit(obj, 'a', 'c'))
    })

    it('should match array form results', () => {
      const obj = { a: 1, b: 2, c: 3 }
      expect(omit(obj, 'a', 'c')).toStrictEqual(omit(obj, ['a', 'c']))
    })
  })

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const obj = {}
      expect(omit(obj, ['a'])).toStrictEqual(lodashOmit(obj, ['a']))
    })

    it('should handle single-property object', () => {
      const obj = { only: 'one' }
      expect(omit(obj, ['only'])).toStrictEqual(lodashOmit(obj, ['only']))
    })

    it('should handle large key list', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 }
      const keys = ['a', 'c', 'e']
      expect(omit(obj, keys)).toStrictEqual(lodashOmit(obj, keys))
    })

    it('should handle duplicate keys in omit list', () => {
      const obj = { a: 1, b: 2, c: 3 }
      expect(omit(obj, ['a', 'a', 'b'])).toStrictEqual(
        lodashOmit(obj, ['a', 'a', 'b']),
      )
    })

    it('should only include own properties (differs from lodash)', () => {
      // lodash includes inherited enumerable properties; our implementation
      // intentionally uses Object.keys (own properties only) which is safer
      const parent = { inherited: true }
      const child = Object.create(parent)
      child.own = 'value'

      const result = omit(child, [])
      expect(result).toStrictEqual({ own: 'value' })
      expect(result).not.toHaveProperty('inherited')
    })
  })
})
