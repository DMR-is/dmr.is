import {
  computeAdditionalSalary,
  computeBonusSalary,
  computeRegularWages,
  parsedRegularHourlyWage,
} from './report-employee.model'

describe('report-employee salary derivation', () => {
  describe('computeAdditionalSalary (viðbótarlaun)', () => {
    it('sums the three fixed sub-components', () => {
      expect(
        computeAdditionalSalary({
          additionalFixedOvertime: 100000,
          additionalFixedCarAllowance: 25000,
          additionalFixedOther: 5000,
        }),
      ).toBe(130000)
    })

    it('treats null children as 0', () => {
      expect(
        computeAdditionalSalary({
          additionalFixedOvertime: 100000,
          additionalFixedCarAllowance: null,
          additionalFixedOther: null,
        }),
      ).toBe(100000)
    })

    it('is 0 when every child is null', () => {
      expect(
        computeAdditionalSalary({
          additionalFixedOvertime: null,
          additionalFixedCarAllowance: null,
          additionalFixedOther: null,
        }),
      ).toBe(0)
    })
  })

  describe('computeBonusSalary (aukagreiðslur)', () => {
    it('sums the three incidental sub-components', () => {
      expect(
        computeBonusSalary({
          bonusOccasionalOvertime: 2000,
          bonusOccasionalCarAllowance: 1000,
          bonusOther: 8000,
        }),
      ).toBe(11000)
    })

    it('treats null children as 0', () => {
      expect(
        computeBonusSalary({
          bonusOccasionalOvertime: 5000,
          bonusOccasionalCarAllowance: null,
          bonusOther: null,
        }),
      ).toBe(5000)
    })

    it('is 0 when every child is null', () => {
      expect(
        computeBonusSalary({
          bonusOccasionalOvertime: null,
          bonusOccasionalCarAllowance: null,
          bonusOther: null,
        }),
      ).toBe(0)
    })
  })

  describe('computeRegularWages (regluleg laun)', () => {
    const fixed = {
      baseSalary: 500000,
      additionalFixedOvertime: 100000,
      additionalFixedCarAllowance: 25000,
      additionalFixedOther: 5000,
    }

    it('is grunnlaun + viðbótarlaun', () => {
      expect(computeRegularWages(fixed)).toBe(630000)
    })

    /**
     * ⚠️ **The pin.** Template 2.0 excluded tilfallandi greiðslur from regluleg
     * laun, and this is the assertion that fails if anyone widens the formula
     * back. It is written against the PUBLIC surface rather than the field list
     * so it keeps working if the incidental sub-components are renamed again:
     * whatever they are called, they must not reach this number.
     *
     * Paired with the same check one level up, on tímakaup, because the wage is
     * what every downstream statistic actually consumes.
     */
    it('excludes aukagreiðslur — adding incidental pay does not move it', () => {
      const withIncidentalPay = {
        ...fixed,
        bonusOccasionalOvertime: 300000,
        bonusOccasionalCarAllowance: 40000,
        bonusOther: 90000,
      }

      expect(computeRegularWages(withIncidentalPay)).toBe(
        computeRegularWages(fixed),
      )
    })

    it('leaves reglulegt tímakaup unmoved by aukagreiðslur', () => {
      const paidHours = 173.33

      expect(parsedRegularHourlyWage({ ...fixed, paidHours })).toBe(
        parsedRegularHourlyWage({
          ...fixed,
          paidHours,
          bonusOccasionalOvertime: 300000,
          bonusOccasionalCarAllowance: 40000,
          bonusOther: 90000,
        }),
      )
    })
  })

  describe('parsedRegularHourlyWage', () => {
    /**
     * Quantizes to storage precision BEFORE dividing, so a preview computed on
     * raw parsed floats lands on the same figure as the same row read back from
     * `DECIMAL(_, 2)` columns. The lágmarksmengi is picked by a greedy walk over
     * contributions, so a divergence here can select different employees before
     * and after submit.
     */
    it('matches the same inputs already rounded to stored precision', () => {
      const raw = {
        paidHours: 160.005,
        baseSalary: 500000.004,
        additionalFixedOvertime: 100000.006,
        additionalFixedCarAllowance: null,
        additionalFixedOther: null,
      }
      const stored = {
        paidHours: 160.01,
        baseSalary: 500000,
        additionalFixedOvertime: 100000.01,
        additionalFixedCarAllowance: null,
        additionalFixedOther: null,
      }

      expect(parsedRegularHourlyWage(raw)).toBe(parsedRegularHourlyWage(stored))
    })

    /**
     * Pins the `== null` guard in `nullableToStored`. Under `=== null` an
     * omitted field becomes `toStoredPrecision(undefined)` → `NaN`, which
     * `?? 0` does not rescue, so the whole wage returns `NaN` and later NaNs
     * every figure in the report through `Math.log` in the pooled fit.
     *
     * Reachable for real: `ParsedEmployeeDto` is a request body on
     * `POST /reports/salary-analysis`, and its pay fields are `@ApiOptionalNumber`
     * (`IsOptional()`) despite being typed `!: number | null` — so a client that
     * omits one passes validation. `additionalFixedOther` is new in template
     * 2.0, so any client not yet updated omits precisely this field.
     *
     * The cast is the point: it reproduces what the HTTP boundary delivers,
     * which the declared type says cannot happen.
     */
    it('treats an omitted sub-component as 0, not NaN', () => {
      const withOmittedField = {
        paidHours: 160,
        baseSalary: 500000,
        additionalFixedOvertime: 100000,
        additionalFixedCarAllowance: null,
        // `additionalFixedOther` deliberately absent.
      } as unknown as Parameters<typeof parsedRegularHourlyWage>[0]

      const wage = parsedRegularHourlyWage(withOmittedField)

      expect(Number.isFinite(wage)).toBe(true)
      expect(wage).toBe(3750)
    })
  })
})
