/**
 * Public surface of the `report-comment` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/create-report-comment.dto'
export * from './dto/report-comment.dto'
export * from './models/report-comment.model'
export * from './report-comment.core.module'
export * from './report-comment.service.interface'
