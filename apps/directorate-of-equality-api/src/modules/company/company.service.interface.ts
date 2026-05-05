import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import { CreateCompanyInput } from './dto/create-company-input.dto'
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto'
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto'
import { SubsidiaryReportSnapshotLookup } from './dto/subsidiary-report-snapshot-lookup.dto'
import { SubsidiaryReportSnapshotSourceDto } from './dto/subsidiary-report-snapshot-source.dto'

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
  rskLookup(nationalId: string): Promise<CompanyLookupDto>
  create(input: CreateCompanyInput): Promise<CompanyDto>
  getOrCreateSubsidiaryReportSnapshotSource(
    input: SubsidiaryReportSnapshotLookup,
  ): Promise<SubsidiaryReportSnapshotSourceDto>
}

export const ICompanyService = Symbol('ICompanyService')
