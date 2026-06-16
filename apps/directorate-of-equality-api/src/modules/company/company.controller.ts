import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentAdminUser } from '../../core/decorators/current-admin-user.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ParseNationalIdPipe } from '../../core/pipes/parse-national-id.pipe'
import { ICompanyCommentService } from '../company-comment/company-comment.service.interface'
import { CreateCompanyCommentDto } from '../company-comment/dto/create-company-comment.dto'
import { UserModel } from '../user/models/user.model'
import { CompanyDto } from './dto/company.dto'
import { CompanyCommentDto } from './dto/company-comment.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import { CompanyTimelineItemDto } from './dto/company-timeline-item.dto'
import { CreateCompanyDto } from './dto/create-company.dto'
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto'
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto'
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto'
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
    @Inject(ICompanyCommentService)
    private readonly companyCommentService: ICompanyCommentService,
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

  @Patch(':id/status')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'updateCompanyStatus',
    type: CompanyDto,
    include404: true,
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyStatusDto,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<CompanyDto> {
    return this.companyService.updateStatus(id, dto, admin.id)
  }

  @Get(':id/timeline')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'getCompanyTimeline',
    type: [CompanyTimelineItemDto],
    include404: true,
  })
  async getTimeline(
    @Param('id') id: string,
  ): Promise<CompanyTimelineItemDto[]> {
    return this.companyService.getTimeline(id)
  }

  @Get(':id/comments')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'getCompanyComments',
    type: [CompanyCommentDto],
    include404: true,
  })
  async getComments(
    @Param('id') id: string,
  ): Promise<CompanyCommentDto[]> {
    return this.companyCommentService.getByCompanyId(id)
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'createCompanyComment',
    status: 201,
    type: CompanyCommentDto,
    include404: true,
  })
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateCompanyCommentDto,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<CompanyCommentDto> {
    return this.companyCommentService.create(id, admin.id, dto)
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'commentId', type: String })
  @DoeResponse({ operationId: 'deleteCompanyComment', include404: true })
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    return this.companyCommentService.delete(id, commentId)
  }
}
