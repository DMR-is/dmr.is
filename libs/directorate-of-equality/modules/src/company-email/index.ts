/**
 * Public surface of the `company-email` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/company-email.dto'
export * from './dto/company-email-preview.dto'
export * from './dto/presign-company-email-attachment.dto'
export * from './dto/send-company-email.dto'
export * from './dto/send-company-email-response.dto'
export * from './models/company-email.enums'
export * from './models/company-email.model'
export * from './models/company-email-attachment.model'
export * from './models/company-email-recipient.model'
export * from './company-email.core.module'
export * from './company-email.messages'
export * from './company-email.service.interface'
