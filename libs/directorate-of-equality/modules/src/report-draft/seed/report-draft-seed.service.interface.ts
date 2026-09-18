import { CompanyDto } from '../../company/dto/company.dto'
import { DraftDetailDto } from '../draft/dto/draft-detail.dto'

/**
 * Bulk-populates a DRAFT salary report from an uploaded workbook (staged in S3,
 * addressed by object key). Replace semantics: the draft's existing scoring
 * content is cleared first, then the parsed workbook is persisted (scores stay
 * NULL — they are derived, and frozen only at submit).
 */
export interface IReportDraftSeedService {
  seedFromWorkbook(
    providerId: string,
    company: CompanyDto,
    key: string,
  ): Promise<DraftDetailDto>
}

export const IReportDraftSeedService = Symbol('IReportDraftSeedService')
