import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'

import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { MachineClientGuard } from '../../../core/guards/machine-client.guard'
import { GetExternalAdvertsDto } from '../../../models/advert.model'
import { IAdvertService } from '../../advert/advert.service.interface'
import {
  CreateAdditionalAnnouncementsDto,
  RegisterCompanyFirmaskraDto,
  RegisterCompanyHlutafelagDto,
} from '../external-systems.dto'
import { ICompanyService } from './company.service.interface'

@Controller({
  path: 'companies',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, MachineClientGuard, ThrottlerGuard)
// Added throttling to limit requests to 5000 per hour
@Throttle({ long: { limit: 5000, ttl: 3600000 } })
export class CompanyController {
  constructor(
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
    @Inject(IAdvertService)
    private readonly advertService: IAdvertService,
  ) {}

  @Post('hlutafelag')
  @LGResponse({
    operationId: 'registerHlutafelag',
    description: 'Register a new company (Hlutafélag nýskráning)',
    status: 201,
  })
  async registerCompany(@Body() body: RegisterCompanyHlutafelagDto) {
    return this.companyService.registerCompanyHlutafelag(body)
  }

  @Post('firmaskra')
  @LGResponse({
    operationId: 'registerFirmaskra',
    description: 'Register a new company from (Firmaskrá - Fyrirtækjaskrá)',
    status: 201,
  })
  async registerCompanyFromFirmaskra(
    @Body() body: RegisterCompanyFirmaskraDto,
  ) {
    return this.companyService.registerCompanyFirmaskra(body)
  }

  @Post('aukatilkynningar')
  @LGResponse({ operationId: 'createAdditionalAnnouncements', status: 201 })
  async createAdditionalAnnouncements(
    @Body() body: CreateAdditionalAnnouncementsDto,
  ) {
    return this.companyService.createAdditionalAnnouncements(body)
  }

  @Get('advertsByExternalId/:id')
  @LGResponse({
    operationId: 'getAdvertsByExternalId',
    type: GetExternalAdvertsDto,
  })
  getAdvertByExternalId(@Param('id') externalId: string) {
    return this.advertService.getAdvertsByExternalId(externalId)
  }
}
