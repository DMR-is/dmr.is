import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
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

  @Get('regular-hourly-wage-by-score-all')
  @DoeResponse({
    operationId: 'getRegularHourlyWageByScoreAll',
    include404: true,
    description:
      'Reglulegt tímakaup ((grunnlaun + viðbótarlaun + aukagreiðslur) / greiddar stundir) by gender and total score (all criteria). Returns scatter data points, a linear regression line, score-bucket averages with wage gap, and overall totals.',
    type: SalaryByGenderAndScoreDto,
  })
  async getRegularHourlyWageByScoreAll(
    @Param('reportId') reportId: string,
  ): Promise<SalaryByGenderAndScoreDto> {
    return this.reportStatisticsService.getRegularHourlyWageByScoreAll(reportId)
  }

  @Get('regular-hourly-wage-by-score-work')
  @DoeResponse({
    operationId: 'getRegularHourlyWageByScoreWork',
    include404: true,
    description:
      'Reglulegt tímakaup ((grunnlaun + viðbótarlaun + aukagreiðslur) / greiddar stundir) by gender and work score (mandatory criteria only, excludes PERSONAL). Returns scatter data points, a linear regression line, score-bucket averages with wage gap, and overall totals.',
    type: SalaryByGenderAndScoreDto,
  })
  async getRegularHourlyWageByScoreWork(
    @Param('reportId') reportId: string,
  ): Promise<SalaryByGenderAndScoreDto> {
    return this.reportStatisticsService.getRegularHourlyWageByScoreWork(
      reportId,
    )
  }

  @Get('regular-hourly-wage-gender-wage-gap')
  @DoeResponse({
    operationId: 'getRegularHourlyWageGenderWageGap',
    include404: true,
    description:
      'Gender wage gap for reglulegt tímakaup ((grunnlaun + viðbótarlaun + aukagreiðslur) / greiddar stundir). ' +
      'Returns average and median hourly wages per gender with both average-based and median-based wage gap percentages.',
    type: GenderWageGapDto,
  })
  async getRegularHourlyWageGenderWageGap(
    @Param('reportId') reportId: string,
  ): Promise<GenderWageGapDto> {
    return this.reportStatisticsService.getRegularHourlyWageGenderWageGap(
      reportId,
    )
  }

  @Get('benefits-breakdown')
  @DoeResponse({
    operationId: 'getBenefitsBreakdown',
    include404: true,
    description:
      'Average bonus salary (aukagreiðslur) and additional salary (viðbótarlaun) by gender. ' +
      'Raw monthly component sums, NOT converted to an hourly rate — they do not sit on the same scale as the reglulegt tímakaup figures. Returns per-gender breakdown with wage gap for each component and total.',
    type: BenefitsBreakdownDto,
  })
  async getBenefitsBreakdown(
    @Param('reportId') reportId: string,
  ): Promise<BenefitsBreakdownDto> {
    return this.reportStatisticsService.getBenefitsBreakdown(reportId)
  }
}
