/**
 * Public surface of the `data-export` module — the files behind
 * "Keyra út lista".
 *
 * As elsewhere, the concrete service class is deliberately absent: consumers
 * inject `IDataExportService` and import `DataExportCoreModule`, which is what
 * binds the two.
 */

export * from './dto/data-export.dto'
export * from './data-export.core.module'
export * from './data-export.service.interface'
