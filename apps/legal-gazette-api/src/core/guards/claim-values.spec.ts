import { audienceValues, scopeValues } from './claim-values'

describe('claim values', () => {
  describe('audienceValues', () => {
    it('keeps a string whole, as one audience', () => {
      expect(audienceValues('a b')).toEqual(['a b'])
    })

    it('keeps the string entries of an array and drops the rest', () => {
      expect(audienceValues([42, 'client', null, ['nested']])).toEqual([
        'client',
      ])
    })

    it.each([undefined, null, 42, {}])('reads %p as no audience', (value) => {
      expect(audienceValues(value)).toEqual([])
    })
  })

  describe('scopeValues', () => {
    it('splits a string on spaces and drops empty entries', () => {
      expect(scopeValues(' a  b ')).toEqual(['a', 'b'])
    })

    it('keeps the string entries of an array, unsplit', () => {
      expect(scopeValues([42, 'a b', 'c'])).toEqual(['a b', 'c'])
    })

    it.each([undefined, null, 42, {}])('reads %p as no scopes', (value) => {
      expect(scopeValues(value)).toEqual([])
    })
  })
})
