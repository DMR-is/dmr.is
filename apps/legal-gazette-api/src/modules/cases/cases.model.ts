import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
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

import { CaseCategoryModel } from '../case-category/case-category.model'
import {
  CasePublicationDateCreateAttributes,
  CasePublicationDateModel,
} from '../case-publication-dates/case-publication-dates.model'
import {
  CaseStatusModel,
  CaseStatusSlug,
} from '../case-status/case-status.model'
import { CaseTypeModel } from '../case-type/case-type.model'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from '../communication-channel/communication-channel.model'

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

type CaseCreateAttributes = {
  typeId: string
  categoryId: string
  caseStatusId: string
  caseNumber: string
  communicationChannels?: CommunicationChannelCreateAttributes[]
  publicationDates?: CasePublicationDateCreateAttributes[]
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
    {
      as: 'nextPublicationDate',
      model: CasePublicationDateModel,
      attributes: ['scheduledAt', 'publishedAt'],
      limit: 1,
      order: [['scheduledAt', 'ASC']],
      where: {
        publishedAt: null,
      },
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
      {
        as: 'nextPublicationDate',
        model: CasePublicationDateModel,
        attributes: ['scheduledAt', 'publishedAt'],
        limit: 1,
        order: [['scheduledAt', 'ASC']],
        where: {
          publishedAt: null,
        },
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
      {
        as: 'nextPublicationDate',
        model: CasePublicationDateModel,
        attributes: ['scheduledAt', 'publishedAt'],
        limit: 1,
        order: [['scheduledAt', 'ASC']],
        where: {
          publishedAt: null,
        },
      },
    ],
  },
}))
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
    defaultValue: CASE_STATUS_SUBMITTED_ID,
  })
  @ForeignKey(() => CaseStatusModel)
  statusId!: string

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

  @HasMany(() => CasePublicationDateModel)
  publicationDates!: CasePublicationDateModel[]
}
