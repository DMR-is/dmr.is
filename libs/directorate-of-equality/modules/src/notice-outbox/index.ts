/**
 * Public surface of the `notice-outbox` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './models/notice-outbox.enums'
export * from './models/notice-outbox.model'
export * from './notice-outbox.core.module'
export * from './notice-outbox.service.interface'
