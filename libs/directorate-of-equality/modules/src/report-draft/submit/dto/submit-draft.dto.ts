import {
  ApiDto,
  ApiOptionalBoolean,
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
 *
 * The report identifier is NOT supplied: it is a meaningless pseudonymous
 * handle, so the server mints it at submit and returns it on the draft/report
 * reads.
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

  @ApiOptionalBoolean({
    description:
      'When true, defers the outlier explanations on this SALARY report: any detected outlier not already assigned to an outlier group is placed in a default group with an empty explanation, and the report lands in POSTPONED for the applicant to resolve later via PUT /application/reports/{providerId}/outliers. Defaults to false. All-or-none — postponement applies to the whole report, not individual rows. Requires at least one detected outlier, and is rejected on an EQUALITY report. When every detected outlier is already assigned to a fully explained group there is nothing to defer and the report is SUBMITTED as normal.',
  })
  outliersPostponed?: boolean
}
