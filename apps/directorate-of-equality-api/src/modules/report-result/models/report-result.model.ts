import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { SalaryResultSnapshot } from '../../report/lib/compensation-aggregates'
import { ReportModel } from '../../report/models/report.model'
import type { ReportResultDto } from '../dto/report-result.dto'

const parseDecimal = (raw: unknown): number | null =>
  raw === null || raw === undefined ? null : parseFloat(raw as string)

export type ReportResultAttributes = {
  reportId: string
  salaryDifferenceThresholdPercent: number | null
  calculationVersion: string
  baseSnapshot: SalaryResultSnapshot
  fullSnapshot: SalaryResultSnapshot
}

export type ReportResultCreateAttributes = Omit<
  ReportResultAttributes,
  'calculationVersion'
> & {
  calculationVersion?: string
}

@MutableTable({ tableName: DoeModels.REPORT_RESULT })
export class ReportResultModel extends MutableModel<
  ReportResultAttributes,
  ReportResultCreateAttributes
> {
  @ForeignKey(() => ReportModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: true,
    field: 'report_id',
  })
  reportId!: string

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    field: 'salary_difference_threshold_percent',
    get() {
      return parseDecimal(
        this.getDataValue('salaryDifferenceThresholdPercent'),
      )
    },
  })
  salaryDifferenceThresholdPercent!: number | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: 'v1',
    field: 'calculation_version',
  })
  calculationVersion!: string

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    field: 'base_snapshot',
  })
  baseSnapshot!: SalaryResultSnapshot

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    field: 'full_snapshot',
  })
  fullSnapshot!: SalaryResultSnapshot

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  static fromModel(model: ReportResultModel): ReportResultDto {
    return {
      id: model.id,
      reportId: model.reportId,
      salaryDifferenceThresholdPercent: model.salaryDifferenceThresholdPercent,
      calculationVersion: model.calculationVersion,
      base: model.baseSnapshot,
      full: model.fullSnapshot,
    }
  }

  fromModel(): ReportResultDto {
    return ReportResultModel.fromModel(this)
  }
}
