import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { LGResponse } from '../../decorators/lg-response.decorator'
import {
  CreateAdditionalAnnouncementsDto,
  RegisterCompanyFirmaskraDto,
  RegisterCompanyHlutafelagDto,
} from '../../dto/external-systems.dto'
import { MachineClientGuard } from '../../guards/machine-client.guard'
import { ICompanyService } from './company.service.interface'

@Controller({
  path: 'companies',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, MachineClientGuard)
export class CompanyController {
  constructor(
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
  ) {}

  @Post('hlutafelag')
  @LGResponse({
    operationId: 'registerHlutafelag',
    description: 'Register a new company (Hlutafélag nýskráning)',
  })
  async registerCompany(@Body() body: RegisterCompanyHlutafelagDto) {
    return this.companyService.registerCompanyHlutafelag(body)
  }

  @Post('firmaskra')
  @LGResponse({
    operationId: 'registerFirmaskra',
    description: 'Register a new company from (Firmaskrá - Fyrirtækjaskrá)',
  })
  async registerCompanyFromFirmaskra(
    @Body() body: RegisterCompanyFirmaskraDto,
  ) {
    return this.companyService.registerCompanyFirmaskra(body)
  }

  @Post('aukatilkynningar')
  @LGResponse({ operationId: 'createAdditionalAnnouncements' })
  async createAdditionalAnnouncements(
    @Body() body: CreateAdditionalAnnouncementsDto,
  ) {
    return this.companyService.createAdditionalAnnouncements(body)
  }
}
