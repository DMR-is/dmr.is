import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import { CompanyRskPreviewDto } from './dto/company-rsk-preview.dto'
import { CompanyTimelineItemDto } from './dto/company-timeline-item.dto'
import { CreateCompanyInput } from './dto/create-company-input.dto'
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto'
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto'
import { IsatCategoryDto } from './dto/isat-category.dto'
import { IsatSectionDto } from './dto/isat-section.dto'
import { LegacyReportDto } from './dto/legacy-report.dto'
import { SearchIsatCategoriesQueryDto } from './dto/search-isat-categories-query.dto'
import { SubsidiaryReportSnapshotLookup } from './dto/subsidiary-report-snapshot-lookup.dto'
import { SubsidiaryReportSnapshotSourceDto } from './dto/subsidiary-report-snapshot-source.dto'
import { UpdateCompanyEmailDto } from './dto/update-company-email.dto'
import { UpdateCompanyFinesDto } from './dto/update-company-fines.dto'
import { UpdateCompanyIsatDto } from './dto/update-company-isat.dto'
import { UpdateCompanyQuarantineDto } from './dto/update-company-quarantine.dto'
import { UpdateCompanySectorDto } from './dto/update-company-sector.dto'
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto'

export {
  CreateCompanyInput,
  GetCompaniesQueryDto,
  GetCompaniesResponseDto,
  SubsidiaryReportSnapshotLookup,
  SubsidiaryReportSnapshotSourceDto,
}

/**
 * The minimum a company contributes to an outbound mailing: who it is, where to
 * write, and whether it may be written to at all.
 *
 * `quarantined` is carried rather than filtered out here on purpose. The caller
 * has to be able to *say* a company was excluded and why — a recipient list that
 * silently shrinks is one an admin cannot check.
 */
export type CompanyMailRecipient = {
  id: string
  name: string
  email: string | null
  quarantined: boolean
}

export interface ICompanyService {
  getAll(query: GetCompaniesQueryDto): Promise<GetCompaniesResponseDto>

  /**
   * Every company matching `filter`, **unpaged**, as mail recipients.
   *
   * Runs the identical `where`/`include` the company list runs
   * (`buildCompanyListQuery`), so "send to everyone matching this filter"
   * resolves to exactly the rows the list would have shown.
   */
  findMailRecipientsByFilter(
    filter: GetCompaniesQueryDto,
  ): Promise<CompanyMailRecipient[]>

  /**
   * The named companies as mail recipients. Ids that match nothing are simply
   * absent from the result — the caller compares counts and decides whether a
   * missing company is an error.
   */
  findMailRecipientsByIds(ids: string[]): Promise<CompanyMailRecipient[]>
  getById(id: string): Promise<CompanyDto>
  getByNationalId(nationalId: string): Promise<CompanyDto>
  getOrCreateByNationalId(
    nationalId: string,
    fallbackName?: string,
  ): Promise<CompanyDto>
  rskLookup(nationalId: string): Promise<CompanyLookupDto>
  getRskCompanyPreview(nationalId: string): Promise<CompanyRskPreviewDto>
  create(input: CreateCompanyInput): Promise<CompanyDto>
  getOrCreateSubsidiaryReportSnapshotSource(
    input: SubsidiaryReportSnapshotLookup,
  ): Promise<SubsidiaryReportSnapshotSourceDto>
  updateStatus(
    id: string,
    dto: UpdateCompanyStatusDto,
    actorUserId: string,
  ): Promise<CompanyDto>
  updateIsat(
    id: string,
    dto: UpdateCompanyIsatDto,
    actorUserId: string,
  ): Promise<CompanyDto>
  updateEmail(
    id: string,
    dto: UpdateCompanyEmailDto,
    actorUserId: string,
  ): Promise<CompanyDto>
  updateFines(
    id: string,
    dto: UpdateCompanyFinesDto,
    actorUserId: string,
  ): Promise<CompanyDto>
  updateQuarantine(
    id: string,
    dto: UpdateCompanyQuarantineDto,
    actorUserId: string,
  ): Promise<CompanyDto>
  getTimeline(id: string): Promise<CompanyTimelineItemDto[]>
  getLegacyReports(id: string): Promise<LegacyReportDto[]>
  searchIsatCategories(
    query: SearchIsatCategoriesQueryDto,
  ): Promise<IsatCategoryDto[]>
  listIsatSections(): Promise<IsatSectionDto[]>
  updateSector(
    id: string,
    dto: UpdateCompanySectorDto,
    actorUserId: string,
  ): Promise<CompanyDto>
}

export const ICompanyService = Symbol('ICompanyService')
