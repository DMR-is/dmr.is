import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { CreateDraftDto } from './dto/create-draft.dto'

export interface IReportDraftService {
  /**
   * Opens a bare report row in `DRAFT` status at "initial contact". Idempotent
   * on the `(provider_type, provider_id)` tuple and emits no audit events.
   */
  createDraft(input: CreateDraftDto): Promise<CreateReportResponseDto>
}

export const IReportDraftService = Symbol('IReportDraftService')
