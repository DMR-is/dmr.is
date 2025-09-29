import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'

import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { MachineClientGuard } from '../../guards/machine-client.guard'
import { RegisterCompanyDto } from './dto/company.dto'
import { ICompanyService } from './company.service.interface'

@Controller({
  path: 'companies',
  version: '1',
})
@UseGuards(TokenJwtAuthGuard, MachineClientGuard)
export class CompanyController {
  constructor(
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
  ) {}

  @Post('register')
  @LGResponse({ operationId: 'registerCompany' })
  async registerCompany(@Body() body: RegisterCompanyDto) {
    return this.companyService.registerCompany(body)
  }
}
