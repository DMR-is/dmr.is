/**
 * Public surface of the `user` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/create-user.body.dto'
export * from './dto/get-users.query.dto'
export * from './dto/update-user.body.dto'
export * from './dto/user.dto'
export * from './models/user.model'
export * from './types/user-role'
export * from './user.core.module'
export * from './user.service.interface'
