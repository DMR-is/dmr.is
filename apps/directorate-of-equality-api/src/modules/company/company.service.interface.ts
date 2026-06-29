import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import { CompanyTimelineItemDto } from './dto/company-timeline-item.dto'
import { CreateCompanyInput } from './dto/create-company-input.dto'
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto'
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto'
import { IsatCategoryDto } from './dto/isat-category.dto'
import { SearchIsatCategoriesQueryDto } from './dto/search-isat-categories-query.dto'
import { SubsidiaryReportSnapshotLookup } from './dto/subsidiary-report-snapshot-lookup.dto'
import { SubsidiaryReportSnapshotSourceDto } from './dto/subsidiary-report-snapshot-source.dto'
import { UpdateCompanyEmailDto } from './dto/update-company-email.dto'
import { UpdateCompanyFinesDto } from './dto/update-company-fines.dto'
import { UpdateCompanyIsatDto } from './dto/update-company-isat.dto'
import { UpdateCompanyQuarantineDto } from './dto/update-company-quarantine.dto'
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto'

export {
  CreateCompanyInput,
  GetCompaniesQueryDto,
  GetCompaniesResponseDto,
  SubsidiaryReportSnapshotLookup,
  SubsidiaryReportSnapshotSourceDto,
}

export interface ICompanyService {
  getAll(query: GetCompaniesQueryDto): Promise<GetCompaniesResponseDto>
  getById(id: string): Promise<CompanyDto>
  getByNationalId(nationalId: string): Promise<CompanyDto>
  getOrCreateByNationalId(
    nationalId: string,
    fallbackName?: string,
  ): Promise<CompanyDto>
  rskLookup(nationalId: string): Promise<CompanyLookupDto>
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
  searchIsatCategories(
    query: SearchIsatCategoriesQueryDto,
  ): Promise<IsatCategoryDto[]>
}

export const ICompanyService = Symbol('ICompanyService')
