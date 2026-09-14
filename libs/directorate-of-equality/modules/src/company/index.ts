/**
 * Public surface of the `company` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './company.core.module'
export * from './company.service.interface'
export * from './dto/company-comment.dto'
export * from './dto/company-event.dto'
export * from './dto/company-lookup.dto'
export * from './dto/company-report.dto'
export * from './dto/company-rsk-preview.dto'
export * from './dto/company-timeline-item.dto'
export * from './dto/company.dto'
export * from './dto/create-company-input.dto'
export * from './dto/create-company.dto'
export * from './dto/get-companies-query.dto'
export * from './dto/get-companies-response.dto'
export * from './dto/isat-category.dto'
export * from './dto/isat-section.dto'
export * from './dto/legacy-report.dto'
export * from './dto/partner-company.dto'
export * from './dto/search-isat-categories-query.dto'
export * from './dto/subsidiary-report-snapshot-lookup.dto'
export * from './dto/subsidiary-report-snapshot-source.dto'
export * from './dto/update-company-email.dto'
export * from './dto/update-company-fines.dto'
export * from './dto/update-company-isat.dto'
export * from './dto/update-company-quarantine.dto'
export * from './dto/update-company-sector.dto'
export * from './dto/update-company-status.dto'
export * from './models/company-comment.model'
export * from './models/company-event.model'
export * from './models/company-report.model'
export * from './models/company.enums'
export * from './models/company.model'
export * from './models/isat-category.model'
export * from './models/isat-section.model'
export * from './models/legacy-report.model'

/**
 * The two obligation predicates, by name — NOT `export *` from
 * `utils/report-status`.
 *
 * That module is internal: it also holds the query alias, the legacy-coverage
 * builders and every status `CASE`, all of which exist to be composed into the
 * company read scope and the list filter, and none of which another module has
 * any business assembling for itself.
 *
 * These two are the exception because "does this company owe this report" is a
 * rule that has to hold *outside* the register too — `ReportDeadlineReminderTask`
 * decides who receives a statutory deadline notice on it. Restating it there
 * rather than importing it is how the mailer and the admin list come to
 * disagree about who owes what, which is exactly the bug this export exists to
 * prevent.
 */
export { equalityRequiredSql, salaryRequiredSql } from './utils/report-status'
