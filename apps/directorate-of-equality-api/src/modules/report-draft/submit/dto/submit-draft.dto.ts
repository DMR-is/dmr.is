import {
  ApiDto,
  ApiOptionalDtoArray,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import {
  SubmitReportCompanyDto,
  SubmitReportSubsidiaryDto,
} from '../../../application/dto/submit-report-company.dto'

/**
 * Body for finalising a draft (DRAFT → SUBMITTED/POSTPONED). The report's
 * content already lives on the draft (contact/admin/headcount via the header
 * PATCH; employees/criteria/outliers via CRUD). What is supplied here is the
 * company snapshot — frozen at submit — and, for a salary report, the approved
 * equality report it is audited against.
 */
export class SubmitDraftDto {
  @ApiDto(SubmitReportCompanyDto)
  company!: SubmitReportCompanyDto

  @ApiOptionalDtoArray(SubmitReportSubsidiaryDto)
  subsidiaries?: SubmitReportSubsidiaryDto[]

  @ApiOptionalUUID({
    nullable: true,
    description:
      'Required for SALARY reports: the APPROVED equality report this salary submission is audited against.',
  })
  equalityReportId?: string | null
}
