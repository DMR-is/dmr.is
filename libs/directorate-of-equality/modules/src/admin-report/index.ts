/**
 * Public surface of the `admin-report` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './admin-report.core.module'
export * from './admin-report.service.interface'
export * from './dto/admin-equality-report.dto'
export * from './dto/admin-salary-report.dto'
