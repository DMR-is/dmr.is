/**
 * Public surface of the `report-create` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/create-equality-report.dto'
export * from './dto/create-report-response.dto'
export * from './dto/create-report.dto'
export * from './report-create.core.module'
export * from './report-create.service.interface'
