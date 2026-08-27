import {
  ReportProviderEnum,
  ReportTypeEnum,
} from '../../../report/models/report.enums'

/**
 * Internal input for `ReportDraftService.createDraft`. Opens a bare `report`
 * row in `DRAFT` status at "initial contact" — before any content exists. The
 * applicant then builds the report up via the report-draft CRUD endpoints and
 * submits later, which is when the snapshot/aggregate pipeline runs.
 *
 * Not a request body: the controller maps its `CreateDraftReportDto` plus the
 * authenticated company onto this shape (binding the provider channel).
 */
export class CreateDraftDto {
  type!: ReportTypeEnum
  providerType!: ReportProviderEnum
  providerId!: string
  companyNationalId!: string
}
