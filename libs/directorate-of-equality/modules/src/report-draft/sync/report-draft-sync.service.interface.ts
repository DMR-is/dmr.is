import { CompanyDto } from '../../company/dto/company.dto'
import { SyncDraftDto } from './dto/sync-draft.dto'

/**
 * Applies a bulk-sync batch to a DRAFT report. Resolves and owns the draft
 * once, then applies every collection's tagged commands in dependency order
 * inside the request (CLS) transaction — the whole batch commits together or
 * rolls back on the first failure.
 */
export interface IReportDraftSyncService {
  syncDraft(
    providerId: string,
    company: CompanyDto,
    input: SyncDraftDto,
  ): Promise<void>
}

export const IReportDraftSyncService = Symbol('IReportDraftSyncService')
