import { ApiEnum, ApiString } from '@dmr.is/decorators'

import { ReportTypeEnum } from '../../../report/models/report.enums'

/**
 * Request body for `POST /api/v1/application/reports/draft`. Sent at "initial
 * contact" — the applicant leaving the prerequisites step upstream — to open a
 * DRAFT report the application portal then builds up via the report-draft CRUD
 * endpoints before submitting. The authenticated company is resolved from the
 * JWT; the report type and the upstream application id are supplied here.
 */
export class CreateDraftReportDto {
  @ApiEnum(ReportTypeEnum)
  type!: ReportTypeEnum

  @ApiString({
    description:
      'Upstream island.is application UUID, stored as the report provider_id.',
  })
  providerId!: string
}
