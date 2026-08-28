/**
 * Public surface of the `report-excel` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/import-error.dto'
export * from './dto/parsed-report.dto'
export * from './report-excel.core.module'
export * from './report-excel.service.interface'
