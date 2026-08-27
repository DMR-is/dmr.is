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

import {
  CompanyCommentDto,
  CompanyDto,
  CompanyLookupDto,
  CompanyRskPreviewDto,
  CompanyTimelineItemDto,
  CreateCompanyDto,
  GetCompaniesQueryDto,
  GetCompaniesResponseDto,
  ICompanyService,
  IsatCategoryDto,
  IsatSectionDto,
  SearchIsatCategoriesQueryDto,
  UpdateCompanyEmailDto,
  UpdateCompanyFinesDto,
  UpdateCompanyIsatDto,
  UpdateCompanyQuarantineDto,
  UpdateCompanySectorDto,
  UpdateCompanyStatusDto,
} from '@dmr.is/doe-modules/company'
import {
  CreateCompanyCommentDto,
  ICompanyCommentService,
} from '@dmr.is/doe-modules/company-comment'
import { UserModel } from '@dmr.is/doe-modules/user'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentAdminUser } from '../../core/decorators/current-admin-user.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ParseNationalIdPipe } from '../../core/pipes/parse-national-id.pipe'

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

  @Get('isat-categories')
  @DoeResponse({
    operationId: 'searchIsatCategories',
    type: [IsatCategoryDto],
  })
  async searchIsatCategories(
    @Query() query: SearchIsatCategoriesQueryDto,
  ): Promise<IsatCategoryDto[]> {
    return this.companyService.searchIsatCategories(query)
  }

  @Get('isat-sections')
  @DoeResponse({
    operationId: 'listIsatSections',
    type: [IsatSectionDto],
  })
  async listIsatSections(): Promise<IsatSectionDto[]> {
    return this.companyService.listIsatSections()
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

  @Get('preview/:nationalId')
  @ApiParam({ name: 'nationalId', type: String })
  @DoeResponse({
    operationId: 'getRskCompanyPreview',
    type: CompanyRskPreviewDto,
    include404: true,
  })
  async getRskCompanyPreview(
    @Param('nationalId', ParseNationalIdPipe) nationalId: string,
  ): Promise<CompanyRskPreviewDto> {
    return this.companyService.getRskCompanyPreview(nationalId)
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

  // Manual sector classification. PRIVATE/PUBLIC marks the value admin-owned so
  // a backfill won't overwrite it; UNKNOWN clears that flag. See updateSector.
  @Patch(':id/sector')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'updateCompanySector',
    type: CompanyDto,
    include404: true,
  })
  async updateSector(
    @Param('id') id: string,
    @Body() dto: UpdateCompanySectorDto,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<CompanyDto> {
    return this.companyService.updateSector(id, dto, admin.id)
  }

  @Patch(':id/isat')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'updateCompanyIsat',
    type: CompanyDto,
    include404: true,
  })
  async updateIsat(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyIsatDto,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<CompanyDto> {
    return this.companyService.updateIsat(id, dto, admin.id)
  }

  @Patch(':id/fines')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'updateCompanyFines',
    type: CompanyDto,
    include404: true,
  })
  async updateFines(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyFinesDto,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<CompanyDto> {
    return this.companyService.updateFines(id, dto, admin.id)
  }

  @Patch(':id/email')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'updateCompanyEmail',
    type: CompanyDto,
    include404: true,
  })
  async updateEmail(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyEmailDto,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<CompanyDto> {
    return this.companyService.updateEmail(id, dto, admin.id)
  }

  @Patch(':id/quarantine')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'updateCompanyQuarantine',
    type: CompanyDto,
    include404: true,
  })
  async updateQuarantine(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyQuarantineDto,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<CompanyDto> {
    return this.companyService.updateQuarantine(id, dto, admin.id)
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'getCompanyById',
    type: CompanyDto,
    include404: true,
  })
  async getCompanyById(@Param('id') id: string): Promise<CompanyDto> {
    return this.companyService.getById(id)
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
