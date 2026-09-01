/**
 * Public surface of the `mail` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './doe-mail.module'
export * from './mail-send.error'
export * from './doe-mail.service.interface'
