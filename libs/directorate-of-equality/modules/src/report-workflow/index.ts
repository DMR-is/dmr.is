/**
 * Public surface of the `report-workflow` module.
 *
 * Concrete `*.service.ts` classes are deliberately absent: consumers inject the
 * `I*Service` symbol and import the core module, which is what binds the two.
 * Exporting the class would let a caller bypass that indirection.
 */

export * from './dto/assign-report.dto'
export * from './dto/deny-report.dto'
export * from './report-workflow.core.module'
export * from './report-workflow.service.interface'
