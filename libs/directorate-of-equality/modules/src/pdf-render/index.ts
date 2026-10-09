/**
 * Public surface of the `pdf-render` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './pdf-render.core.module'
export * from './pdf-render.service.interface'
