import { Op } from 'sequelize'
import {
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
  HasOne,
  Scopes,
} from 'sequelize-typescript'

import {
  CASE_STATUS_SUBMITTED_ID,
  LegalGazetteModels,
} from '@dmr.is/legal-gazette/constants'
import {
  BASE_ENTITY_ATTRIBUTES,
  BaseModel,
  BaseTable,
} from '@dmr.is/shared/models/base'

import { AdvertCreateAttributes, AdvertModel } from '../advert/advert.model'
import { CaseCategoryModel } from '../case-category/case-category.model'
import {
  CaseStatusModel,
  CaseStatusSlug,
} from '../case-status/case-status.model'
import { CaseTypeModel } from '../case-type/case-type.model'
import {
  CommonCaseCreationAttributes,
  CommonCaseModel,
} from '../common-case/common-case.model'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from '../communication-channel/communication-channel.model'

type CaseAttributes = {
  typeId: string
  categoryId: string
  caseStatusId: string
  caseNumber: string
  type: CaseTypeModel
  category: CaseCategoryModel
  status: CaseStatusModel
  communicationChannels: CommunicationChannelModel[]
  commonCase?: CommonCaseModel
  adverts?: AdvertModel[]
}

type CaseCreateAttributes = {
  typeId: string
  categoryId: string
  applicationId?: string
  caseId?: string
  communicationChannels?: CommunicationChannelCreateAttributes[]
  adverts?: AdvertCreateAttributes[]
  commonCase?: CommonCaseCreationAttributes
}

@BaseTable({ tableName: LegalGazetteModels.CASES })
@DefaultScope(() => ({
  attributes: ['id', 'createdAt'],
  include: [
    {
      model: CaseTypeModel,
      attributes: BASE_ENTITY_ATTRIBUTES,
    },
    {
      model: CaseCategoryModel,
      attributes: BASE_ENTITY_ATTRIBUTES,
    },
    {
      model: CaseStatusModel,
      attributes: BASE_ENTITY_ATTRIBUTES,
    },
    {
      model: CommunicationChannelModel,
    },
  ],
}))
@Scopes(() => ({
  submitted: {
    attributes: ['id', 'createdAt'],
    include: [
      {
        model: CaseTypeModel,
        attributes: BASE_ENTITY_ATTRIBUTES,
      },
      {
        model: CaseCategoryModel,
        attributes: BASE_ENTITY_ATTRIBUTES,
      },
      {
        model: CaseStatusModel,
        attributes: BASE_ENTITY_ATTRIBUTES,
        where: {
          slug: CaseStatusSlug.SUBMITTED,
        },
      },
      {
        model: CommunicationChannelModel,
      },
    ],
  },
  readyForPublication: {
    attributes: ['id', 'createdAt'],
    include: [
      {
        model: CaseTypeModel,
        attributes: BASE_ENTITY_ATTRIBUTES,
      },
      {
        model: CaseCategoryModel,
        attributes: BASE_ENTITY_ATTRIBUTES,
      },
      {
        model: CaseStatusModel,
        attributes: BASE_ENTITY_ATTRIBUTES,
        where: {
          slug: CaseStatusSlug.READY_FOR_PUBLICATION,
        },
      },
      {
        model: CommunicationChannelModel,
      },
    ],
  },
}))
export class CaseModel extends BaseModel<CaseAttributes, CaseCreateAttributes> {
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'application_id',
    defaultValue: null,
  })
  applicationId?: string

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
    defaultValue: CASE_STATUS_SUBMITTED_ID,
  })
  @ForeignKey(() => CaseStatusModel)
  statusId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'case_number',
    defaultValue: ''.padEnd(10, '0'), // Placeholder for case number
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

  @HasMany(() => AdvertModel, 'caseId')
  adverts?: AdvertModel[]

  @HasOne(() => CommonCaseModel, 'id')
  commonCase?: CommonCaseModel

  @BeforeCreate
  static async generateCaseNumber(instance: CaseModel) {
    const year = instance.createdAt.getFullYear()
    const month = String(instance.createdAt.getMonth() + 1).padStart(2, '0')
    const day = String(instance.createdAt.getDate()).padStart(2, '0')

    const count = await CaseModel.count({
      where: { caseNumber: { [Op.like]: `${year}%` } },
    })

    instance.caseNumber = `${year}${month}${day}${String(count + 1).padStart(
      3,
      '0',
    )}`
  }
}
