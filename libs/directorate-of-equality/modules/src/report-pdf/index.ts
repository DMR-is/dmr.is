/**
 * Public surface of the `report-pdf` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './report-pdf.core.module'
export * from './report-pdf.service.interface'
