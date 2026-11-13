/**
 * Public surface of the `report-attachment` module.
 *
 * As elsewhere, the concrete service class is not exported: consumers inject
 * `IReportAttachmentService` and import the core module.
 */

export * from './dto/add-report-attachment.dto'
export * from './dto/report-attachment.dto'
export * from './lib/attachment-file'
export * from './models/report-attachment.model'
export * from './report-attachment.core.module'
export * from './report-attachment.service.interface'
