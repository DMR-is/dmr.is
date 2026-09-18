/**
 * Public surface of the `config` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './config.core.module'
export * from './config.service.interface'
export * from './dto/config.dto'
export * from './models/config.model'
