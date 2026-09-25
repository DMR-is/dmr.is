import { Module } from '@nestjs/common'

import { AggregateStatisticsApiModule } from '../aggregate-statistics/aggregate-statistics.api.module'

/**
 * The public statistics surface, backing the `swagger/statistics` document.
 *
 * Separate from `DoeApplicationSwaggerModule` because the audience and the
 * boundary differ: this is read without any credential by island.is's public
 * pages, over its own X-Road service, while the application surface is
 * token-guarded and applicant-facing. Keeping them apart means a client
 * generated for one never carries the other.
 *
 * As with the other aggregates, `AppModule` and `SWAGGER_CONFIG` both name this
 * module, and `swagger-coverage.spec.ts` checks that they agree.
 */
@Module({
  imports: [AggregateStatisticsApiModule],
})
export class DoeStatisticsSwaggerModule {}
