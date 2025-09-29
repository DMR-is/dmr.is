import { Injectable } from '@nestjs/common'

import { RegisterCompanyDto } from './dto/company.dto'
import { ICompanyService } from './company.service.interface'

@Injectable()
export class CompanyService implements ICompanyService {
  registerCompany(body: RegisterCompanyDto): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
