import { CompanyDto } from '../../company/dto/company.dto'
import { CreateReportResponseDto } from '../../report-create/dto/create-report-response.dto'
import { SubmitDraftDto } from './dto/submit-draft.dto'

/**
 * Finalises a DRAFT report: validates it, freezes the derived scores + result
 * snapshot, creates the immutable company_report snapshot from the payload,
 * runs the shared finalization (sibling withdrawal, SUBMITTED event, soft
 * auto-review), and transitions DRAFT → SUBMITTED (or POSTPONED when a salary
 * report's outliers are acknowledged but not yet explained).
 */
export interface IReportDraftSubmitService {
  submitDraft(
    providerId: string,
    company: CompanyDto,
    input: SubmitDraftDto,
  ): Promise<CreateReportResponseDto>
}

export const IReportDraftSubmitService = Symbol('IReportDraftSubmitService')
