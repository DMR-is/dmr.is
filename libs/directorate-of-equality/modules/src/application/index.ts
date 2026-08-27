/**
 * Public surface of the `application` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './application.core.module'
export * from './provider-channel'
export * from './application.service.interface'
export * from './dto/application-report-comment.dto'
export * from './dto/application-report-detail.dto'
export * from './dto/edit-equality-content.dto'
export * from './dto/edit-outliers.dto'
export * from './dto/salary-report-eligibility.dto'
export * from './dto/sub-criterion-catalog.dto'
export * from './dto/submit-application-report-comment.dto'
export * from './dto/submit-equality-report.dto'
export * from './dto/submit-report-company.dto'
export * from './dto/submit-salary-report.dto'
