import { leadingIsatDigits, leadingPostcode } from './snapshot-codes'

describe('leadingIsatDigits', () => {
  it.each([
    ['62010', '62010'],
    ['62.01.0', '62010'],
    ['62.01', '6201'],
    ['62', '62'],
    ['J62.01', '6201'],
    ['62.01.0 Hugbúnaðargerð', '62010'],
    ['  62010 Hugbúnaðargerð', '62010'],
    ['99.99', '9999'],
  ])('reads %j as %j', (value, expected) => {
    expect(leadingIsatDigits(value)).toBe(expected)
  })

  it.each(['', '   ', 'ÍSAT-flokkur', '6', '620101', '62.01.0.1', 'abc'])(
    'finds no code in %j',
    (value) => {
      expect(leadingIsatDigits(value)).toBeNull()
    },
  )
})

describe('leadingPostcode', () => {
  it.each([
    ['101', '101'],
    ['101 Reykjavík', '101'],
    [' 600 Akureyri', '600'],
  ])('reads %j as %j', (value, expected) => {
    expect(leadingPostcode(value)).toBe(expected)
  })

  it.each(['', '99999', '10', 'Reykjavík'])(
    'finds no postcode in %j',
    (value) => {
      expect(leadingPostcode(value)).toBeNull()
    },
  )
})
