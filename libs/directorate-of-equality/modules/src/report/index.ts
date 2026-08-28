/**
 * Public surface of the `report` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/equality-report-summary.dto'
export * from './dto/equality-report.dto'
export * from './dto/get-report-outlier-groups-response.dto'
export * from './dto/get-report-outliers.query.dto'
export * from './dto/get-reports-for-company-response.dto'
export * from './dto/get-reports-response.dto'
export * from './dto/get-reports.query.dto'
export * from './dto/report-detail.dto'
export * from './dto/report-event.dto'
export * from './dto/report-list-item.dto'
export * from './dto/report-overview-statistics.dto'
export * from './dto/report-overview.dto'
export * from './dto/report-timeline-item.dto'
export * from './dto/report.dto'
export * from './lib/wage-gap-decomposition'
export * from './models/report-event.model'
export * from './models/report.enums'
export * from './models/report.model'
export * from './report.core.module'
export * from './report.service.interface'
export * from './types/report-resource-context'
