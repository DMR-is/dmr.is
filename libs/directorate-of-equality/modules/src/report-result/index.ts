/**
 * Public surface of the `report-result` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/report-result.dto'
export * from './models/report-result.model'
export * from './report-result.core.module'
export * from './report-result.service.interface'
