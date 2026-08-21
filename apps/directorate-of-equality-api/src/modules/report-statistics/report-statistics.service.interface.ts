import { BenefitsBreakdownDto } from './dto/benefits-breakdown.dto'
import { GenderWageGapDto } from './dto/gender-wage-gap.dto'
import { SalaryByGenderAndScoreDto } from './dto/salary-by-gender-and-score.dto'

export interface IReportStatisticsService {
  getRegularHourlyWageByScoreAll(
    reportId: string,
  ): Promise<SalaryByGenderAndScoreDto>

  getRegularHourlyWageByScoreWork(
    reportId: string,
  ): Promise<SalaryByGenderAndScoreDto>

  getRegularHourlyWageGenderWageGap(reportId: string): Promise<GenderWageGapDto>

  getBenefitsBreakdown(reportId: string): Promise<BenefitsBreakdownDto>
}

export const IReportStatisticsService = Symbol('IReportStatisticsService')
