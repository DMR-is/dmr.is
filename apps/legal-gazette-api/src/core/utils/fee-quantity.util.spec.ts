import { AdvertTemplateType } from '../../models/advert.model'
import { TypeIdEnum } from '../../models/type.model'
import {
  feeQuantityForChange,
  resolveFeeQuantity,
  warnOnZeroFeeQuantity,
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

describe('feeQuantityForChange', () => {
  const FORECLOSURE = TypeIdEnum.FORECLOSURE.toLowerCase()
  const content = property('A') + property('B')
  const common = {
    templateType: AdvertTemplateType.COMMON,
    transactionId: null,
    legacyId: null,
  }

  describe('free-text advert', () => {
    it('re-derives the count when retyped into a foreclosure', () => {
      expect(
        feeQuantityForChange({
          advert: common,
          previousTypeId: 'type-a',
          typeId: FORECLOSURE,
          content,
        }),
      ).toBe(2)
    })

    it('clears the count when it stops being a foreclosure', () => {
      expect(
        feeQuantityForChange({
          advert: common,
          previousTypeId: FORECLOSURE,
          typeId: 'type-b',
          content,
        }),
      ).toBeNull()
    })

    it('leaves unrelated types untouched', () => {
      expect(
        feeQuantityForChange({
          advert: common,
          previousTypeId: 'type-a',
          typeId: 'type-b',
          content,
        }),
      ).toBeUndefined()
    })
  })

  describe('frozen advert', () => {
    it.each([
      ['charged', { transactionId: 'transaction-1' }],
      ['legacy', { legacyId: 'legacy-1' }],
    ])('keeps the quantity of a %s advert', (_, frozen) => {
      const advert = { ...common, ...frozen }

      expect(
        feeQuantityForChange({
          advert,
          previousTypeId: 'type-a',
          typeId: FORECLOSURE,
          content,
        }),
      ).toBeUndefined()
      expect(
        feeQuantityForChange({
          advert,
          previousTypeId: FORECLOSURE,
          typeId: FORECLOSURE,
          content,
          explicitQuantity: 7,
        }),
      ).toBeUndefined()
    })
  })

  it('lets an explicit quantity win over the derived one', () => {
    expect(
      feeQuantityForChange({
        advert: common,
        previousTypeId: FORECLOSURE,
        typeId: FORECLOSURE,
        content,
        explicitQuantity: 5,
      }),
    ).toBe(5)
  })

  describe('template foreclosure', () => {
    const template = {
      templateType: AdvertTemplateType.FORECLOSURE,
      transactionId: null,
      legacyId: null,
    }

    it('takes its count from the properties, not the content', () => {
      expect(
        feeQuantityForChange({
          advert: template,
          previousTypeId: FORECLOSURE,
          typeId: FORECLOSURE,
          content: null,
          propertyCount: 4,
        }),
      ).toBe(4)
    })

    it('clears the count once retyped away', () => {
      expect(
        feeQuantityForChange({
          advert: template,
          previousTypeId: FORECLOSURE,
          typeId: 'type-b',
          content: null,
          propertyCount: 4,
        }),
      ).toBeNull()
    })

    it('restores the count when moved back to foreclosures', () => {
      expect(
        feeQuantityForChange({
          advert: template,
          previousTypeId: 'type-b',
          typeId: FORECLOSURE,
          content: null,
          propertyCount: 4,
        }),
      ).toBe(4)
    })

    it('keeps the column when no property count is known', () => {
      expect(
        feeQuantityForChange({
          advert: template,
          previousTypeId: FORECLOSURE,
          typeId: FORECLOSURE,
          content: null,
        }),
      ).toBeUndefined()
    })
  })
})

describe('warnOnZeroFeeQuantity', () => {
  const logger = { warn: jest.fn() } as unknown as Parameters<
    typeof warnOnZeroFeeQuantity
  >[0]

  beforeEach(() => jest.clearAllMocks())

  it('warns on zero items, with the type', () => {
    warnOnZeroFeeQuantity(logger, {
      advertId: 'advert-1',
      typeId: 'type-a',
      feeQuantity: 0,
      context: 'Test',
    })

    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), {
      advertId: 'advert-1',
      typeId: 'type-a',
      context: 'Test',
    })
  })

  it.each([null, undefined, 3])('does not warn on %p', (feeQuantity) => {
    warnOnZeroFeeQuantity(logger, {
      advertId: 'advert-1',
      typeId: 'type-a',
      feeQuantity,
      context: 'Test',
    })

    expect(logger.warn).not.toHaveBeenCalled()
  })
})
