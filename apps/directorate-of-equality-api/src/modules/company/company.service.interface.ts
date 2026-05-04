import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import { CompanyReportSnapshotLookup } from './dto/company-report-snapshot-lookup.dto'
import { CompanyReportSnapshotSourceDto } from './dto/company-report-snapshot-source.dto'
import { CreateCompanyInput } from './dto/create-company-input.dto'

export {
  CompanyReportSnapshotLookup,
  CompanyReportSnapshotSourceDto,
  CreateCompanyInput,
}

export interface ICompanyService {
  getAll(): Promise<CompanyDto[]>
  getById(id: string): Promise<CompanyDto>
  getByNationalId(nationalId: string): Promise<CompanyDto>
  rskLookup(nationalId: string): Promise<CompanyLookupDto>
  create(input: CreateCompanyInput): Promise<CompanyDto>
  getOrCreateReportSnapshotSource(
    input: CompanyReportSnapshotLookup,
  ): Promise<CompanyReportSnapshotSourceDto>
}

export const ICompanyService = Symbol('ICompanyService')
