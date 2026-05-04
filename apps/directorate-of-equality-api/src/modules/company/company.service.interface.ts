import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import { CompanyReportSnapshotLookup } from './dto/company-report-snapshot-lookup.dto'
import { CompanyReportSnapshotSourceDto } from './dto/company-report-snapshot-source.dto'
import { CreateCompanyInput } from './dto/create-company-input.dto'
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto'
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto'

export {
  CompanyReportSnapshotLookup,
  CompanyReportSnapshotSourceDto,
  CreateCompanyInput,
  GetCompaniesQueryDto,
  GetCompaniesResponseDto,
}

export interface ICompanyService {
  getAll(query: GetCompaniesQueryDto): Promise<GetCompaniesResponseDto>
  getById(id: string): Promise<CompanyDto>
  getByNationalId(nationalId: string): Promise<CompanyDto>
  rskLookup(nationalId: string): Promise<CompanyLookupDto>
  create(input: CreateCompanyInput): Promise<CompanyDto>
  getOrCreateReportSnapshotSource(
    input: CompanyReportSnapshotLookup,
  ): Promise<CompanyReportSnapshotSourceDto>
}

export const ICompanyService = Symbol('ICompanyService')
