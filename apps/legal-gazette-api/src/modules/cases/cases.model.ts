import addDays from 'date-fns/addDays'
import { Op, Sequelize } from 'sequelize'
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

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { mapIndexToVersion } from '../../lib/utils'
import { AdvertCreateAttributes, AdvertModel } from '../advert/advert.model'
import { AdvertCategoryModel } from '../advert-category/advert-category.model'
import {
  AdvertStatusIdEnum,
  AdvertStatusModel,
} from '../advert-status/advert-status.model'
import {
  AdvertTypeIdEnum,
  AdvertTypeModel,
} from '../advert-type/advert-type.model'
import {
  CommonAdvertCreationAttributes,
  CommonAdvertModel,
} from '../common-advert/common-advert.model'
import { CreateCommonAdvertInternalDto } from '../common-advert/dto/common-advert.dto'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from '../communication-channel/communication-channel.model'

type CaseAttributes = {
  typeId: string
  categoryId: string
  caseStatusId: string
  caseNumber: string
  caseTitle: string
  scheduledAt: Date | null
  type: AdvertTypeModel
  category: AdvertCategoryModel
  status: AdvertStatusModel
  communicationChannels: CommunicationChannelModel[]
  commonCase?: CommonAdvertModel
  adverts?: AdvertModel[]
}

type CaseCreateAttributes = {
  typeId: string
  categoryId: string
  caseTitle: string
  applicationId?: string
  caseId?: string
  communicationChannels: CommunicationChannelCreateAttributes[]
  adverts?: AdvertCreateAttributes[]
  commonCase?: CommonAdvertCreationAttributes
}

@BaseTable({ tableName: LegalGazetteModels.CASE })
@DefaultScope(() => ({
  attributes: [
    [
      Sequelize.literal(`(
        SELECT MIN(advert.scheduled_at)
        FROM advert
        WHERE advert.case_id = "CaseModel"."id" AND advert.published_at IS NULL
      )`),
      'scheduledAt',
    ],
    'id',
    'applicationId',
    'typeId',
    'categoryId',
    'statusId',
    'caseNumber',
    'caseTitle',
    'createdAt',
    'updatedAt',
    'deletedAt',
  ],
  include: [
    AdvertTypeModel,
    AdvertCategoryModel,
    AdvertStatusModel,
    CommunicationChannelModel,
  ],
  order: [
    [
      Sequelize.literal(`(
        SELECT MIN(advert.scheduled_at)
        FROM advert
        WHERE advert.case_id = "CaseModel"."id" AND advert.published_at IS NULL
      )`),
      'ASC NULLS LAST',
    ],
  ],
}))
@Scopes(() => ({
  byApplicationId: (applicationId: string) => ({
    attributes: ['id', 'applicationId'],
    where: { applicationId },
  }),
}))
export class CaseModel extends BaseModel<CaseAttributes, CaseCreateAttributes> {
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'application_id',
    defaultValue: null,
  })
  applicationId?: string

  @Column({ type: DataType.VIRTUAL })
  get scheduledAt(): Date | null {
    const value = this.getDataValue('scheduledAt')
    if (value === null) return null
    return new Date(value)
  }

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_type_id',
  })
  @ForeignKey(() => AdvertTypeModel)
  typeId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_category_id',
  })
  @ForeignKey(() => AdvertCategoryModel)
  categoryId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_status_id',
    defaultValue: AdvertStatusIdEnum.SUBMITTED,
  })
  @ForeignKey(() => AdvertStatusModel)
  statusId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'case_number',
    defaultValue: ''.padEnd(10, '0'), // Placeholder for case number
  })
  caseNumber!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'case_title',
  })
  caseTitle!: string

  @BelongsTo(() => AdvertTypeModel)
  type!: AdvertTypeModel

  @BelongsTo(() => AdvertCategoryModel)
  category!: AdvertCategoryModel

  @BelongsTo(() => AdvertStatusModel)
  status!: AdvertStatusModel

  @HasMany(() => CommunicationChannelModel)
  communicationChannels!: CommunicationChannelModel[]

  @HasMany(() => AdvertModel, 'caseId')
  adverts?: AdvertModel[]

  @HasOne(() => CommonAdvertModel, 'id')
  commonCase?: CommonAdvertModel

  @BeforeCreate
  static async generateCaseNumber(instance: CaseModel) {
    const year = instance.createdAt.getFullYear()
    const month = String(instance.createdAt.getMonth() + 1).padStart(2, '0')
    const day = String(instance.createdAt.getDate()).padStart(2, '0')

    const count = await CaseModel.unscoped().count({
      where: { caseNumber: { [Op.like]: `${year}%` } },
    })

    instance.caseNumber = `${year}${month}${day}${String(count + 1).padStart(
      3,
      '0',
    )}`
  }

  static async setCaseStatus(id: string, status: AdvertStatusIdEnum) {
    this.logger.info('Setting case status', {
      context: 'CaseModel',
      id,
      status,
    })

    try {
      await this.update({ caseStatusId: status }, { where: { id } })
    } catch (error) {
      this.logger.error('Error setting case status', {
        context: 'CaseModel',
        error,
      })
      throw error
    }
  }

  static async createCommonCase(body: CreateCommonAdvertInternalDto) {
    this.logger.info('Creating common case', { context: 'CaseModel' })

    try {
      await this.create(
        {
          applicationId: body.applicationId,
          categoryId: body.categoryId,
          typeId: AdvertTypeIdEnum.COMMON_APPLICATION,
          caseTitle: body.caption,
          communicationChannels:
            body.channels?.map((ch) => ({
              email: ch.email,
              name: ch?.name,
              phone: ch?.phone,
            })) ?? [],
          commonCase: {
            caption: body.caption,
            signatureDate: new Date(body.signature.date),
            signatureLocation: body.signature.location,
            signatureName: body.signature.name,
          },
          adverts:
            body.publishingDates.length > 0
              ? body.publishingDates.map((date, i) => ({
                  html: body.html,
                  scheduledAt: new Date(date),
                  version: mapIndexToVersion(i),
                }))
              : [
                  {
                    html: body.html,
                    scheduledAt: addDays(new Date(), 14),
                  },
                ],
        },
        {
          include: [CommunicationChannelModel, CommonAdvertModel, AdvertModel],
        },
      )
    } catch (error) {
      this.logger.error('Error creating common case', {
        context: 'CaseModel',
        error,
      })
      throw error
    }
  }
}
