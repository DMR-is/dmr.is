/**
 * Public surface of the `report-statistics` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/benefits-breakdown.dto'
export * from './dto/gender-wage-gap.dto'
export * from './dto/pay-dispersion.dto'
export * from './dto/salary-analysis.request.dto'
export * from './dto/salary-analysis.response.dto'
export * from './dto/salary-by-gender-and-score.dto'
export * from './lib/pay-dispersion'
export * from './report-statistics.core.module'
export * from './report-statistics.service.interface'
