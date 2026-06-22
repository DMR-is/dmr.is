import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { ReportModel } from '../../report/models/report.model'
import type { ReportOutlierGroupDto } from '../dto/report-outlier-group.dto'
import { ReportEmployeeOutlierModel } from './report-employee-outlier.model'

type ReportOutlierGroupAttributes = {
  reportId: string
  name: string
  reason: string | null
  action: string | null
  signatureName: string | null
  signatureRole: string | null
}

type ReportOutlierGroupCreateAttributes = {
  reportId: string
  name: string
  reason?: string | null
  action?: string | null
  signatureName?: string | null
  signatureRole?: string | null
}

/**
 * Owns the improvement-plan explanation (reason / action / signature) shared by
 * the detected outliers assigned to it. See `report-outlier-group.dto.ts` for
 * the lifecycle. The four explanation columns are all-or-none (DB CHECK): all
 * NULL while the report is postponed / not yet filled, or all non-empty once
 * explained. `name` is always set.
 */
@MutableTable({ tableName: DoeModels.REPORT_OUTLIER_GROUP })
export class ReportOutlierGroupModel extends MutableModel<
  ReportOutlierGroupAttributes,
  ReportOutlierGroupCreateAttributes
> {
  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'report_id' })
  reportId!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string

  @Column({ type: DataType.TEXT, allowNull: true })
  reason!: string | null

  @Column({ type: DataType.TEXT, allowNull: true })
  action!: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'signature_name' })
  signatureName!: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'signature_role' })
  signatureRole!: string | null

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  @HasMany(() => ReportEmployeeOutlierModel, {
    foreignKey: 'groupId',
    as: 'outliers',
  })
  outliers?: ReportEmployeeOutlierModel[]

  static fromModel(model: ReportOutlierGroupModel): ReportOutlierGroupDto {
    return {
      id: model.id,
      reportId: model.reportId,
      name: model.name,
      reason: model.reason,
      action: model.action,
      signatureName: model.signatureName,
      signatureRole: model.signatureRole,
    }
  }

  fromModel(): ReportOutlierGroupDto {
    return ReportOutlierGroupModel.fromModel(this)
  }
}
