import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { CaseCategoryModel } from '../case-category/case-category.model'
import { CaseStatusModel } from '../case-status/case-status.model'
import { CaseTypeModel } from '../case-type/case-type.model'
import { CommunicationChannelModel } from '../communication-channel/communication-channel.model'

type CaseAttributes = {
  typeId: string
  categoryId: string
  caseStatusId: string
  caseNumber: string
  communicationChannels: CommunicationChannelModel[]
  type: typeof CaseTypeModel
  category: typeof CaseCategoryModel
  status: typeof CaseStatusModel
}

type CaseCreateAttributes = Pick<
  CaseAttributes,
  'typeId' | 'categoryId' | 'caseStatusId' | 'caseNumber'
>

@BaseTable({ tableName: LegalGazetteModels.CASES })
export class CaseModel extends BaseModel<CaseAttributes, CaseCreateAttributes> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_type_id',
  })
  @ForeignKey(() => CaseTypeModel)
  typeId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_category_id',
  })
  @ForeignKey(() => CaseCategoryModel)
  categoryId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_status_id',
  })
  @ForeignKey(() => CaseStatusModel)
  caseStatusId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'case_number',
  })
  caseNumber!: string

  @BelongsTo(() => CaseTypeModel)
  type!: CaseTypeModel

  @BelongsTo(() => CaseCategoryModel)
  category!: CaseCategoryModel

  @BelongsTo(() => CaseStatusModel)
  status!: CaseStatusModel

  @HasMany(() => CommunicationChannelModel)
  communicationChannels!: CommunicationChannelModel[]
}
