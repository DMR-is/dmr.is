import { AggregateStatisticsDto } from './dto/aggregate-statistics.dto'

/**
 * Aggregate figures for the Jafnlaunakerfi dashboard on island.is.
 *
 * ⚠️ Takes no caller and no filter, and must keep taking neither. It is served
 * without a credential, so the absence of a parameter IS the safety property: a
 * filter argument would let a caller narrow an aggregate until it described one
 * company.
 *
 * The result is computed at most once a day per process and cached until the
 * next midnight UTC (`expiresAt`).
 */
export interface IAggregateStatisticsService {
  getStatistics(): Promise<AggregateStatisticsDto>
}

export const IAggregateStatisticsService = Symbol('IAggregateStatisticsService')
