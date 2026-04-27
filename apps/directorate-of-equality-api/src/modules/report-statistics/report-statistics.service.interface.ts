import { BenefitsBreakdownDto } from './dto/benefits-breakdown.dto'
import { GenderWageGapDto } from './dto/gender-wage-gap.dto'
import { SalaryByGenderAndScoreDto } from './dto/salary-by-gender-and-score.dto'

export interface IReportStatisticsService {
  getBaseSalaryByGenderAndScoreAll(
    reportId: string,
  ): Promise<SalaryByGenderAndScoreDto>

  getBaseSalaryByGenderAndScoreWork(
    reportId: string,
  ): Promise<SalaryByGenderAndScoreDto>

  getFullSalaryByGenderAndScoreAll(
    reportId: string,
  ): Promise<SalaryByGenderAndScoreDto>

  getBaseSalaryGenderWageGap(reportId: string): Promise<GenderWageGapDto>

  getFullSalaryGenderWageGap(reportId: string): Promise<GenderWageGapDto>

  getBenefitsBreakdown(reportId: string): Promise<BenefitsBreakdownDto>
}

export const IReportStatisticsService = Symbol('IReportStatisticsService')
