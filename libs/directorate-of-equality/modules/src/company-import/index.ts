/**
 * Public surface of the `company-import` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './company-import.core.module'
export * from './company-import.service.interface'
export * from './dto/company-import-result.dto'
export * from './dto/parsed-company-row.dto'
