import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import {
  CreateEqualityReportDto,
  CreateReportDto,
  CreateReportResponseDto,
  IReportCreateService,
} from '@dmr.is/doe-modules'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'

@Controller({ path: 'reports', version: '1' })
@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, CompanyResourceGuard)
export class ReportCreateController {
  constructor(
    @Inject(IReportCreateService)
    private readonly reportCreateService: IReportCreateService,
  ) {}

  @Post('salary')
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({
    operationId: 'createSalaryReport',
    status: 201,
    include404: true,
    type: CreateReportResponseDto,
  })
  async createSalary(
    @Body() body: CreateReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.reportCreateService.createSalary(body)
  }

  @Post('equality')
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({
    operationId: 'createEqualityReport',
    status: 201,
    type: CreateReportResponseDto,
  })
  async createEquality(
    @Body() body: CreateEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.reportCreateService.createEquality(body)
  }
}
