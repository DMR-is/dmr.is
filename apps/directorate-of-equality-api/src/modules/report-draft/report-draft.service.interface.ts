import { CompanyDto } from '../company/dto/company.dto'
import { ReportModel } from '../report/models/report.model'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { CreateDraftDto } from './dto/create-draft.dto'
import { DraftDetailDto } from './dto/draft-detail.dto'
import { UpdateDraftDto } from './dto/update-draft.dto'

export interface IReportDraftService {
  /**
   * Opens a bare report row in `DRAFT` status at "initial contact". Idempotent
   * on the `(provider_type, provider_id)` tuple and emits no audit events.
   */
  createDraft(input: CreateDraftDto): Promise<CreateReportResponseDto>

  /** Company-facing read of an in-progress draft (header + child counts). */
  getDraftDetail(
    providerId: string,
    company: CompanyDto,
  ): Promise<DraftDetailDto>

  /** Patches report-level header fields on a draft (PATCH semantics). */
  updateDraft(
    providerId: string,
    company: CompanyDto,
    input: UpdateDraftDto,
  ): Promise<DraftDetailDto>

  /**
   * Resolves a DRAFT report owned by the company by its provider tuple, or
   * throws NotFound. The canonical ownership gate the per-entity draft CRUD
   * services (roles, employees, …) share.
   */
  findOwnedDraft(providerId: string, company: CompanyDto): Promise<ReportModel>
}

export const IReportDraftService = Symbol('IReportDraftService')
