import { Module } from '@nestjs/common'

import { AggregateStatisticsApiModule } from '../aggregate-statistics/aggregate-statistics.api.module'
import { ApplicationApiModule } from '../application/application.api.module'
import { ReportDraftApiModule } from '../report-draft/report-draft.api.module'

/**
 * The applicant-facing surface consumed by the island.is application system —
 * the aggregate backing the `swagger/application` document.
 *
 * `ApplicationApiModule` and `ReportDraftApiModule` share the `application/v1`
 * prefix, the `TokenJwtAuthGuard` + `CompanyResourceGuard` boundary and the
 * `Application` tag, so they generate into a single client class.
 *
 * ⚠️ `AggregateStatisticsApiModule` shares the prefix and the X-Road service
 * but NOT the guard boundary: it answers with no citizen identity
 * (`@PublicRoute`), because the island.is Chart query that reads it is itself
 * unauthenticated and has no citizen token to pass on. Its audience is the
 * Jafnréttisstofa website rather than the application system, so do not assume
 * the boundary above covers everything listed below. Aggregating them here (the
 * mirror of `DoeWebSwaggerModule`) is what keeps runtime registration and the
 * published document from drifting apart: `AppModule` and `SWAGGER_CONFIG` both
 * name this module, so a new applicant-facing api module cannot be routed
 * without also being documented. `swagger-coverage.spec.ts` enforces that.
 *
 * A new api module has to be a **direct** entry in `imports` below. Swagger's
 * `deepScanRoutes` descends exactly one level from a listed module, so an api
 * module imported by `ApplicationApiModule` instead of by this one would answer
 * at runtime and still be missing from the document.
 */
@Module({
  imports: [
    ApplicationApiModule,
    ReportDraftApiModule,
    AggregateStatisticsApiModule,
  ],
})
export class DoeApplicationSwaggerModule {}
