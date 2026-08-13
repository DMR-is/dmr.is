import { Module } from '@nestjs/common'

import { ApplicationApiModule } from '../application/application.api.module'
import { ReportDraftApiModule } from '../report-draft/report-draft.api.module'

/**
 * The applicant-facing surface consumed by the island.is application system —
 * the aggregate backing the `swagger/application` document.
 *
 * Both controllers underneath share the `application/v1` prefix, the
 * `TokenJwtAuthGuard` + `CompanyResourceGuard` boundary and the `Application`
 * tag, so they generate into a single client class. Aggregating them here (the
 * mirror of `DoeWebSwaggerModule`) is what keeps runtime registration and the
 * published document from drifting apart: `AppModule` and `SWAGGER_CONFIG` both
 * name this module, so a new applicant-facing api module cannot be routed
 * without also being documented. `swagger-coverage.spec.ts` enforces that.
 */
@Module({
  imports: [ApplicationApiModule, ReportDraftApiModule],
})
export class DoeApplicationSwaggerModule {}
