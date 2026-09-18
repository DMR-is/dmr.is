/**
 * Public surface of the `company-comment` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './company-comment.core.module'
export * from './company-comment.service.interface'
export * from './dto/create-company-comment.dto'
