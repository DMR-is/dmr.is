/**
 * Public surface of the `report-identifier` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './report-identifier.core.module'
export * from './report-identifier.service.interface'
