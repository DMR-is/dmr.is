import lodashGet from 'lodash/get'

import { get } from './get'

const testObj = {
  a: {
    b: {
      c: 'deep',
      d: null,
      e: 0,
      f: false,
      g: '',
    },
  },
  arr: [1, 2, { nested: 'value' }],
  top: 'level',
  nullVal: null,
  undefinedVal: undefined,
}

describe('get', () => {
  describe('without default value (parity with lodash)', () => {
    const cases: Array<[string, unknown, string]> = [
      // Simple top-level access
      ['top-level key', testObj, 'top'],
      ['missing top-level key', testObj, 'missing'],

      // Deep dot-notation paths
      ['deep nested path', testObj, 'a.b.c'],
      ['deep nested null', testObj, 'a.b.d'],
      ['deep nested zero', testObj, 'a.b.e'],
      ['deep nested false', testObj, 'a.b.f'],
      ['deep nested empty string', testObj, 'a.b.g'],

      // Accessing through null/undefined
      ['path through null value', testObj, 'nullVal.child'],
      ['path through undefined value', testObj, 'undefinedVal.child'],
      ['deeply missing path', testObj, 'a.x.y.z'],

      // Array bracket notation
      ['array index [0]', testObj, 'arr[0]'],
      ['array index [2].nested', testObj, 'arr[2].nested'],

      // Null/undefined objects
      ['null object', null, 'a.b'],
      ['undefined object', undefined, 'a.b'],
    ]

    it.each(cases)('%s', (_name, obj, path) => {
      expect(get(obj, path)).toStrictEqual(lodashGet(obj, path))
    })
  })

  describe('with default value (parity with lodash)', () => {
    const cases: Array<[string, unknown, string, unknown]> = [
      ['missing key with default', testObj, 'missing', 'fallback'],
      ['missing deep path with default', testObj, 'a.x.y', 42],
      ['null object with default', null, 'a', 'default'],
      ['undefined value returns default', testObj, 'undefinedVal', 'default'],
      ['null value does NOT return default', testObj, 'nullVal', 'default'],
      ['existing value ignores default', testObj, 'top', 'default'],
      ['falsy zero ignores default', testObj, 'a.b.e', 'default'],
      ['falsy false ignores default', testObj, 'a.b.f', 'default'],
      ['falsy empty string ignores default', testObj, 'a.b.g', 'default'],
      ['default with empty array', testObj, 'missing', []],
      ['default with null', testObj, 'missing', null],
    ]

    it.each(cases)('%s', (_name, obj, path, defaultValue) => {
      expect(get(obj, path, defaultValue)).toStrictEqual(
        lodashGet(obj, path, defaultValue),
      )
    })
  })

  describe('edge cases', () => {
    it('should handle numeric string keys in objects', () => {
      const obj = { '0': 'zero', '1': 'one' }
      expect(get(obj, '0')).toStrictEqual(lodashGet(obj, '0'))
      expect(get(obj, '1')).toStrictEqual(lodashGet(obj, '1'))
    })

    it('should handle deeply nested arrays', () => {
      const obj = { a: [[['deep']]] }
      expect(get(obj, 'a[0][0][0]')).toStrictEqual(lodashGet(obj, 'a[0][0][0]'))
    })

    it('should handle mixed dot and bracket notation', () => {
      const obj = { a: [{ b: 'found' }] }
      expect(get(obj, 'a[0].b')).toStrictEqual(lodashGet(obj, 'a[0].b'))
    })

    it('should return undefined for empty object with path', () => {
      expect(get({}, 'a.b.c')).toStrictEqual(lodashGet({}, 'a.b.c'))
    })

    it('should handle single-key path', () => {
      const obj = { key: 'value' }
      expect(get(obj, 'key')).toStrictEqual(lodashGet(obj, 'key'))
    })

    it('should handle array at root level', () => {
      const arr = [{ a: 1 }, { a: 2 }]
      expect(get(arr, '[1].a')).toStrictEqual(lodashGet(arr, '[1].a'))
    })

    // Reproduces the ApplicationAnswers union type structure from the
    // legal-gazette codebase where each union member's `fields` sub-type
    // has completely different keys (no shared keys), causing
    // `keyof (CommonFields | RecallFields)` to be `never`.
    it('should resolve paths through union types with disjoint field keys', () => {
      type Company = { companyName: string; companyNationalId: string }

      // Mirrors CommonApplicationAnswers — fields has {type, category, caption}
      type CommonAnswers = {
        additionalText?: string
        fields?: {
          type?: { id: string; title: string }
          category?: { id: string; title: string }
          caption?: string
        }
      }

      // Mirrors RecallBankruptcyAnswers — fields has {settlementFields} but
      // settlementFields does NOT have companies
      type BankruptcyAnswers = {
        additionalText?: string
        fields?: {
          settlementFields?: {
            name?: string
            deadlineDate?: string
          }
        }
      }

      // Mirrors RecallDeceasedAnswers — fields has {settlementFields} AND
      // settlementFields HAS companies (only this member)
      type DeceasedAnswers = {
        additionalText?: string
        fields?: {
          settlementFields?: {
            name?: string
            dateOfDeath?: string
            companies?: Company[]
          }
        }
      }

      type Answers = CommonAnswers | BankruptcyAnswers | DeceasedAnswers

      const deceased: Answers = {
        additionalText: 'test',
        fields: {
          settlementFields: {
            name: 'Test Estate',
            dateOfDeath: '2024-01-01',
            companies: [
              { companyName: 'Company A', companyNationalId: '123' },
              { companyName: 'Company B', companyNationalId: '456' },
            ],
          },
        },
      }

      const common: Answers = {
        fields: {
          type: { id: '1', title: 'General' },
          caption: 'Test caption',
        },
      }

      // Path exists only in DeceasedAnswers — with default value
      const companies = get(
        deceased,
        'fields.settlementFields.companies',
        [],
      )
      const lodashCompanies = lodashGet(
        deceased,
        'fields.settlementFields.companies',
        [],
      )
      expect(companies).toStrictEqual(lodashCompanies)

      // Verify .map() works on the result (would fail with never[])
      const mapped = companies.map((c) => c.companyName)
      expect(mapped).toStrictEqual(['Company A', 'Company B'])

      // Path exists only in CommonAnswers
      expect(get(common, 'fields.type.title', '')).toStrictEqual(
        lodashGet(common, 'fields.type.title', ''),
      )

      // Path doesn't exist in the runtime object
      expect(get(common, 'fields.settlementFields.companies', [])).toStrictEqual(
        lodashGet(common, 'fields.settlementFields.companies', []),
      )

      // Without default — shared base field
      expect(get(deceased, 'additionalText')).toStrictEqual(
        lodashGet(deceased, 'additionalText'),
      )
    })
  })
})
