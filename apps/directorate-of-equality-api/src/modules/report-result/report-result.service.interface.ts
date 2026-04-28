import type { Transaction } from 'sequelize'

import { ReportResultDto } from './dto/report-result.dto'

export interface IReportResultService {
  getByReportId(
    reportId: string,
    transaction?: Transaction,
  ): Promise<ReportResultDto>

  createForReport(
    reportId: string,
    transaction?: Transaction,
  ): Promise<ReportResultDto>
}

export const IReportResultService = Symbol('IReportResultService')
