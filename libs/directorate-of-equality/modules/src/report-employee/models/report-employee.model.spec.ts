import {
  computeAdditionalSalary,
  computeBonusSalary,
} from './report-employee.model'

describe('report-employee salary derivation', () => {
  describe('computeAdditionalSalary (viðbótarlaun)', () => {
    it('sums the two fixed sub-components', () => {
      expect(
        computeAdditionalSalary({
          additionalFixedOvertime: 100000,
          additionalFixedCarAllowance: 25000,
        }),
      ).toBe(125000)
    })

    it('treats null children as 0', () => {
      expect(
        computeAdditionalSalary({
          additionalFixedOvertime: 100000,
          additionalFixedCarAllowance: null,
        }),
      ).toBe(100000)
    })

    it('is 0 when both children are null', () => {
      expect(
        computeAdditionalSalary({
          additionalFixedOvertime: null,
          additionalFixedCarAllowance: null,
        }),
      ).toBe(0)
    })
  })

  describe('computeBonusSalary (aukagreiðslur)', () => {
    it('sums all four occasional / bonus sub-components', () => {
      expect(
        computeBonusSalary({
          bonusOccasionalCarAllowance: 1000,
          bonusOccasionalOvertime: 2000,
          bonusPayments: 4000,
          bonusOther: 8000,
        }),
      ).toBe(15000)
    })

    it('treats null children as 0', () => {
      expect(
        computeBonusSalary({
          bonusOccasionalCarAllowance: null,
          bonusOccasionalOvertime: 5000,
          bonusPayments: null,
          bonusOther: null,
        }),
      ).toBe(5000)
    })

    it('is 0 when all children are null', () => {
      expect(
        computeBonusSalary({
          bonusOccasionalCarAllowance: null,
          bonusOccasionalOvertime: null,
          bonusPayments: null,
          bonusOther: null,
        }),
      ).toBe(0)
    })
  })
})
