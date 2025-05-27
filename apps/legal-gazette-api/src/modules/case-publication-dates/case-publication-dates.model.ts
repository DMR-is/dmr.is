import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { CaseModel } from '../cases/cases.model'

type CasePublicationDateAttributes = {
  caseId: string
  scheduledAt: Date
  publishedAt: Date | null
  version: number
}

export type CasePublicationDateCreateAttributes = {
  caseId: string
  scheduledAt: Date
}

@BaseTable({ tableName: LegalGazetteModels.CASE_PUBLICATION_DATES })
export class CasePublicationDateModel extends BaseModel<
  CasePublicationDateAttributes,
  CasePublicationDateCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  scheduledAt!: Date

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  publishedAt!: Date | null

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  version!: number

  @BelongsTo(() => CaseModel)
  case!: CaseModel
}
