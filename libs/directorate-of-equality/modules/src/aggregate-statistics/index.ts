/**
 * Public surface of the `aggregate-statistics` module — the aggregate figures
 * published on jafnretti.is.
 *
 * As elsewhere, the concrete service class is deliberately absent: consumers
 * inject `IAggregateStatisticsService` and import `AggregateStatisticsCoreModule`.
 */

export * from './dto/aggregate-statistics.dto'
export * from './aggregate-statistics.core.module'
export * from './aggregate-statistics.service.interface'
