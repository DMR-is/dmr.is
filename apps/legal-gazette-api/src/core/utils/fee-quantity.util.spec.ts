import { AdvertTemplateType } from '../../models/advert.model'
import { TypeIdEnum } from '../../models/type.model'
import {
  feeQuantityAfterChange,
  feeQuantityForChange,
  resolveFeeQuantity,
} from './fee-quantity.util'

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

describe('feeQuantityForChange', () => {
  const FORECLOSURE = TypeIdEnum.FORECLOSURE.toLowerCase()
  const content = property('A') + property('B')
  const common = {
    typeId: 'type-a',
    templateType: AdvertTemplateType.COMMON,
  }

  it('re-derives a common advert retyped into a foreclosure', () => {
    expect(
      feeQuantityForChange({ advert: common, typeId: FORECLOSURE, content }),
    ).toBe(2)
  })

  it('keeps the quantity of a charged advert', () => {
    expect(
      feeQuantityForChange({
        advert: { ...common, transactionId: 'transaction-1' },
        typeId: FORECLOSURE,
        content,
      }),
    ).toBeUndefined()
  })

  it('leaves a legacy advert alone', () => {
    expect(
      feeQuantityForChange({
        advert: { ...common, legacyId: 'legacy-1' },
        typeId: FORECLOSURE,
        content,
      }),
    ).toBeUndefined()
  })

  describe('template foreclosure', () => {
    const template = {
      typeId: FORECLOSURE,
      templateType: AdvertTemplateType.FORECLOSURE,
    }

    it('keeps the external count while it stays a foreclosure', () => {
      expect(
        feeQuantityForChange({
          advert: template,
          typeId: FORECLOSURE,
          content,
        }),
      ).toBeUndefined()
    })

    it('clears the count once retyped away', () => {
      expect(
        feeQuantityForChange({ advert: template, typeId: 'type-b', content }),
      ).toBeNull()
    })
  })
})
