import lodashChunk from 'lodash/chunk'

import { chunk } from './chunk'
describe('chunk', () => {
  describe('basic usage (parity with lodash)', () => {
    const cases: Array<[string, number[], number]> = [
      ['even split', [1, 2, 3, 4], 2],
      ['uneven split', [1, 2, 3, 4, 5], 2],
      ['size of one', [1, 2, 3], 1],
      ['size equal to length', [1, 2, 3], 3],
      ['size larger than length', [1, 2, 3], 10],
      ['empty array', [], 2],
    ]
    it.each(cases)('%s', (_name, array, size) => {
      expect(chunk(array, size)).toStrictEqual(lodashChunk(array, size))
    })
  })
  describe('size normalisation (parity with lodash)', () => {
    const cases: Array<[string, number[], number]> = [
      ['zero', [1, 2, 3], 0],
      ['negative', [1, 2, 3], -1],
      ['NaN', [1, 2, 3], NaN],
      ['fraction below one', [1, 2, 3], 0.5],
      ['fraction 1.5', [1, 2, 3, 4], 1.5],
      ['fraction 2.5', [1, 2, 3, 4, 5], 2.5],
      ['Infinity', [1, 2, 3], Infinity],
    ]
    it.each(cases)('%s', (_name, array, size) => {
      expect(chunk(array, size)).toStrictEqual(lodashChunk(array, size))
    })
    it('defaults size to 1 when omitted', () => {
      expect(chunk([1, 2, 3])).toStrictEqual(lodashChunk([1, 2, 3]))
    })
  })
  describe('immutability', () => {
    it('should not modify the original array', () => {
      const array = [1, 2, 3]
      chunk(array, 2)
      expect(array).toStrictEqual([1, 2, 3])
    })
  })
})
