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

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { CreateEqualityReportDto } from './dto/create-equality-report.dto'
import { CreateReportDto } from './dto/create-report.dto'
import { CreateReportResponseDto } from './dto/create-report-response.dto'
import { IReportCreateService } from './report-create.service.interface'

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
