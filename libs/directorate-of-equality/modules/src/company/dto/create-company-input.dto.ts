import { CompanySizeEnum } from '../models/company.enums'

export class CreateCompanyInput {
  name!: string
  nationalId!: string
  employeeCountCategory!: CompanySizeEnum
}
