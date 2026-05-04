import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ParseNationalIdPipe } from '../../core/pipes/parse-national-id.pipe'
import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import { CreateCompanyDto } from './dto/create-company.dto'
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto'
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto'
import { ICompanyService } from './company.service.interface'

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
  @DoeResponse({ operationId: 'getCompanies', type: GetCompaniesResponseDto })
  async getCompanies(
    @Query() query: GetCompaniesQueryDto,
  ): Promise<GetCompaniesResponseDto> {
    return this.companyService.getAll(query)
  }

  @Get('lookup/:nationalId')
  @ApiParam({ name: 'nationalId', type: String })
  @DoeResponse({
    operationId: 'rskLookupCompany',
    type: CompanyLookupDto,
    include404: true,
  })
  async rskLookup(
    @Param('nationalId', ParseNationalIdPipe) nationalId: string,
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
