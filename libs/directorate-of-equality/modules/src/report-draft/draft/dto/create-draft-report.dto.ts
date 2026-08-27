import {
  ApiEnum,
  ApiOptionalDto,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

import { ReportTypeEnum } from '../../../report/models/report.enums'

/**
 * Company identity supplied on first contact, used only as the auto-provision
 * fallback name.
 */
export class CreateDraftCompanyDto {
  @ApiOptionalString({
    description:
      "Legal name of the authenticated company. Only a fallback: the name is normally read from the national registry, and this is what it is used instead when the registry has no entry for the kennitala. Never overwrites an already-known company's name.",
  })
  name?: string
}

/**
 * Request body for `POST /api/v1/application/reports/draft`. Sent at "initial
 * contact" — the applicant leaving the prerequisites step upstream — to open a
 * DRAFT report the application portal then builds up via the report-draft CRUD
 * endpoints before submitting. The authenticated company is resolved from the
 * JWT; the report type and the upstream application id are supplied here.
 *
 * This endpoint auto-provisions the company, so it carries a `company.name`
 * fallback: without one, opening a draft would depend entirely on the national
 * registry naming the kennitala, and a registry miss would block the applicant
 * at the very first step.
 *
 * The fallback is deliberately weaker than the direct-submit endpoints', which
 * require a full `SubmitReportCompanyDto` (name, kennitala and address, all
 * mandatory). Draft-create happens at initial contact, before the portal has
 * collected any of that, so everything here is optional and the name is used
 * only if the registry has nothing. Read off the raw body by
 * `CompanyResourceGuard`, which runs before the whitelist pipe.
 */
export class CreateDraftReportDto {
  @ApiEnum(ReportTypeEnum)
  type!: ReportTypeEnum

  @ApiString({
    description:
      'Upstream island.is application UUID, stored as the report provider_id.',
  })
  providerId!: string

  @ApiOptionalDto(CreateDraftCompanyDto)
  company?: CreateDraftCompanyDto
}
