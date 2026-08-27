/**
 * Public surface of the `location` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/get-postcodes-query.dto'
export * from './dto/postcode.dto'
export * from './dto/region.dto'
export * from './location.core.module'
export * from './location.service.interface'
export * from './models/postcode.model'
export * from './models/region.model'
