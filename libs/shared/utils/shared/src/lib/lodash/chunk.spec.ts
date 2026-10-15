import lodashChunk from 'lodash/chunk'

import { chunk } from './chunk'
describe('chunk', () => {
  describe('basic usage (parity with lodash)', () => {
    const cases: Array<[string, number[], number]> = [
      ['even split', [1, 2, 3, 4], 2],
      ['uneven split', [1, 2, 3, 4, 5], 2],
      ['size of one', [1, 2, 3], 1],
    ]
    it.each(cases)('%s', (_name, array, size) => {
      expect(chunk(array, size)).toStrictEqual(lodashChunk(array, size))
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
