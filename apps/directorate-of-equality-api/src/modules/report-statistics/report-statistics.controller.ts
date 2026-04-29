import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { BenefitsBreakdownDto } from './dto/benefits-breakdown.dto'
import { GenderWageGapDto } from './dto/gender-wage-gap.dto'
import { SalaryByGenderAndScoreDto } from './dto/salary-by-gender-and-score.dto'
import { IReportStatisticsService } from './report-statistics.service.interface'

@Controller({
  path: 'reports/:reportId/statistics',
  version: '1',
})
@ApiTags('Report Statistics')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ReportStatisticsController {
  constructor(
    @Inject(IReportStatisticsService)
    private readonly reportStatisticsService: IReportStatisticsService,
  ) {}

  @Get('base-salary-by-gender-and-score-all')
  @ApiOperation({
    operationId: 'getBaseSalaryByGenderAndScoreAll',
    description:
      'Adjusted base salary (baseSalary / workRatio) by gender and total score (all criteria). ' +
      'Returns scatter data points, a linear regression line, score-bucket averages with wage gap, and overall totals.',
  })
  @ApiResponse({ status: 200, type: SalaryByGenderAndScoreDto })
  async getBaseSalaryByGenderAndScoreAll(
    @Param('reportId') reportId: string,
  ): Promise<SalaryByGenderAndScoreDto> {
    return this.reportStatisticsService.getBaseSalaryByGenderAndScoreAll(
      reportId,
    )
  }

  @Get('base-salary-by-gender-and-score-work')
  @ApiOperation({
    operationId: 'getBaseSalaryByGenderAndScoreWork',
    description:
      'Adjusted base salary (baseSalary / workRatio) by gender and work score (mandatory criteria only, excludes PERSONAL). ' +
      'Returns scatter data points, a linear regression line, score-bucket averages with wage gap, and overall totals.',
  })
  @ApiResponse({ status: 200, type: SalaryByGenderAndScoreDto })
  async getBaseSalaryByGenderAndScoreWork(
    @Param('reportId') reportId: string,
  ): Promise<SalaryByGenderAndScoreDto> {
    return this.reportStatisticsService.getBaseSalaryByGenderAndScoreWork(
      reportId,
    )
  }

  @Get('full-salary-by-gender-and-score-all')
  @ApiOperation({
    operationId: 'getFullSalaryByGenderAndScoreAll',
    description:
      'Adjusted full salary ((baseSalary + additionalSalary + bonusSalary) / workRatio) by gender and total score (all criteria). ' +
      'Returns scatter data points, a linear regression line, score-bucket averages with wage gap, and overall totals.',
  })
  @ApiResponse({ status: 200, type: SalaryByGenderAndScoreDto })
  async getFullSalaryByGenderAndScoreAll(
    @Param('reportId') reportId: string,
  ): Promise<SalaryByGenderAndScoreDto> {
    return this.reportStatisticsService.getFullSalaryByGenderAndScoreAll(
      reportId,
    )
  }

  @Get('base-salary-gender-wage-gap')
  @ApiOperation({
    operationId: 'getBaseSalaryGenderWageGap',
    description:
      'Gender wage gap for adjusted base salary (baseSalary / workRatio). ' +
      'Returns average and median salaries per gender with both average-based and median-based wage gap percentages.',
  })
  @ApiResponse({ status: 200, type: GenderWageGapDto })
  async getBaseSalaryGenderWageGap(
    @Param('reportId') reportId: string,
  ): Promise<GenderWageGapDto> {
    return this.reportStatisticsService.getBaseSalaryGenderWageGap(reportId)
  }

  @Get('full-salary-gender-wage-gap')
  @ApiOperation({
    operationId: 'getFullSalaryGenderWageGap',
    description:
      'Gender wage gap for adjusted full salary ((baseSalary + additionalSalary + bonusSalary) / workRatio). ' +
      'Returns average and median salaries per gender with both average-based and median-based wage gap percentages.',
  })
  @ApiResponse({ status: 200, type: GenderWageGapDto })
  async getFullSalaryGenderWageGap(
    @Param('reportId') reportId: string,
  ): Promise<GenderWageGapDto> {
    return this.reportStatisticsService.getFullSalaryGenderWageGap(reportId)
  }

  @Get('benefits-breakdown')
  @ApiOperation({
    operationId: 'getBenefitsBreakdown',
    description:
      'Average bonus salary (viðbótarlaun) and additional salary (aukagreiðslur) by gender. ' +
      'Raw values, not adjusted for work ratio. Returns per-gender breakdown with wage gap for each component and total.',
  })
  @ApiResponse({ status: 200, type: BenefitsBreakdownDto })
  async getBenefitsBreakdown(
    @Param('reportId') reportId: string,
  ): Promise<BenefitsBreakdownDto> {
    return this.reportStatisticsService.getBenefitsBreakdown(reportId)
  }
}
