import { TypeIdEnum } from '../../models/type.model'
import { feeQuantityAfterChange, resolveFeeQuantity } from './fee-quantity.util'

const property = (name: string) =>
  `<p><strong>Heiti eignar:</strong> ${name}</p><p>Gerðarbeiðandi: X</p>`

describe('resolveFeeQuantity', () => {
  it('counts the properties of a foreclosure', () => {
    const html = ['A', 'B', 'C'].map(property).join('')

    expect(resolveFeeQuantity(TypeIdEnum.FORECLOSURE, html)).toBe(3)
  })

  it('matches the lower-cased type id Postgres returns', () => {
    const html = ['A', 'B'].map(property).join('')

    expect(resolveFeeQuantity(TypeIdEnum.FORECLOSURE.toLowerCase(), html)).toBe(
      2,
    )
  })

  it('returns 0 for a foreclosure without a property label', () => {
    expect(resolveFeeQuantity(TypeIdEnum.FORECLOSURE, '<p>Texti</p>')).toBe(0)
    expect(resolveFeeQuantity(TypeIdEnum.FORECLOSURE, null)).toBe(0)
  })

  it('leaves other types unbilled per item', () => {
    expect(
      resolveFeeQuantity(TypeIdEnum.DIVISION_ENDING, property('A')),
    ).toBeUndefined()
    expect(resolveFeeQuantity(undefined, property('A'))).toBeUndefined()
  })
})

describe('feeQuantityAfterChange', () => {
  const FORECLOSURE = TypeIdEnum.FORECLOSURE.toLowerCase()
  const content = property('A') + property('B')

  it('re-derives the count while the advert is a foreclosure', () => {
    expect(
      feeQuantityAfterChange({
        previousTypeId: 'type-a',
        typeId: FORECLOSURE,
        content,
      }),
    ).toBe(2)
  })

  it('clears the count when the advert stops being a foreclosure', () => {
    expect(
      feeQuantityAfterChange({
        previousTypeId: FORECLOSURE,
        typeId: 'type-b',
        content,
      }),
    ).toBeNull()
  })

  it('leaves unrelated types untouched', () => {
    expect(
      feeQuantityAfterChange({
        previousTypeId: 'type-a',
        typeId: 'type-b',
        content,
      }),
    ).toBeUndefined()
  })
})
