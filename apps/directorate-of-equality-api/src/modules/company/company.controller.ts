import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ICompanyService } from './company.service.interface'
import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import { CreateCompanyDto } from './dto/create-company.dto'

@Controller({
  path: 'companies',
  version: '1',
})
@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class CompanyController {
  constructor(
    @Inject(ICompanyService)
    private readonly companyService: ICompanyService,
  ) {}

  @Get()
  @DoeResponse({ operationId: 'getCompanies', type: [CompanyDto] })
  async getCompanies(): Promise<CompanyDto[]> {
    return this.companyService.getAll()
  }

  @Get('lookup/:nationalId')
  @ApiParam({ name: 'nationalId', type: String })
  @DoeResponse({
    operationId: 'rskLookupCompany',
    type: CompanyLookupDto,
    include404: true,
  })
  async rskLookup(
    @Param('nationalId') nationalId: string,
  ): Promise<CompanyLookupDto> {
    return this.companyService.rskLookup(nationalId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({ operationId: 'createCompany', status: 201, type: CompanyDto })
  async createCompany(@Body() input: CreateCompanyDto): Promise<CompanyDto> {
    return this.companyService.create(input)
  }
}
