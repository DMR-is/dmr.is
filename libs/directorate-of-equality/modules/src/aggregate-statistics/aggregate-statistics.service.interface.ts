import { AggregateStatisticsDto } from './dto/aggregate-statistics.dto'

/**
 * Aggregate figures for publication on jafnretti.is.
 *
 * ⚠️ Takes no caller and no filter, and must keep taking neither. This is the
 * only read in the API served without a credential, so the absence of a
 * parameter IS the safety property: a filter argument would let a caller narrow
 * an aggregate until it described one company, which is exactly what publishing
 * aggregates instead of rows is meant to prevent.
 *
 * Everything it returns is derived from APPROVED filings only — what the
 * Directorate accepted, not what was claimed.
 */
export interface IAggregateStatisticsService {
  getStatistics(): Promise<AggregateStatisticsDto>
}

export const IAggregateStatisticsService = Symbol('IAggregateStatisticsService')
