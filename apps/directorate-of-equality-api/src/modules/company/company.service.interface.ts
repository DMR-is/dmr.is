import { CompanyDto } from './dto/company.dto'

export interface CompanyReportSnapshotLookup {
  name: string
  nationalId: string
}

export interface CompanyReportSnapshotSourceDto {
  companyId: string
  name: string
  nationalId: string
  address: string
  city: string
  postcode: string
  isatCategory: string
}

export interface ICompanyService {
  getByNationalId(nationalId: string): Promise<CompanyDto>
  getOrCreateReportSnapshotSource(
    input: CompanyReportSnapshotLookup,
  ): Promise<CompanyReportSnapshotSourceDto>
}

export const ICompanyService = Symbol('ICompanyService')
