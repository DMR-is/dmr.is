import { Op } from 'sequelize'
import {
  BeforeCreate,
  BeforeDestroy,
  Column,
  DataType,
  DefaultScope,
  HasMany,
  Scopes,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { mapIndexToVersion } from '../../lib/utils'
import { AdvertCreateAttributes, AdvertModel } from '../advert/advert.model'
import { AdvertStatusIdEnum } from '../advert-status/advert-status.model'
import { AdvertTypeIdEnum } from '../advert-type/advert-type.model'
import { CommonAdvertModel } from '../common-advert/common-advert.model'
import { CreateCommonAdvertInternalDto } from '../common-advert/dto/create-common-advert.dto'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from '../communication-channel/communication-channel.model'

const LOGGING_CONTEXT = 'CaseModel'

type CaseAttributes = {
  caseNumber: string
  applicationId: string | null
  assignedUserId: string | null
  communicationChannels: CommunicationChannelModel[]
  adverts: AdvertModel[]
}

type CaseCreateAttributes = {
  applicationId?: string
  caseId?: string
  communicationChannels?: CommunicationChannelCreateAttributes[]
  adverts?: AdvertCreateAttributes[]
}

@BaseTable({ tableName: LegalGazetteModels.CASE })
@DefaultScope(() => ({
  attributes: [
    'id',
    'applicationId',
    'caseNumber',
    'createdAt',
    'updatedAt',
    'deletedAt',
  ],
  order: [['createdAt', 'DESC']],
}))
@Scopes(() => ({
  detailed: {
    include: [
      { model: CommunicationChannelModel, separate: true, duplicating: false },
      {
        model: AdvertModel,
        separate: true,
        include: [{ model: CommonAdvertModel }],
      },
    ],
  },
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
  applicationId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'assigned_user_id',
    defaultValue: null,
  })
  assignedUserId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'case_number',
    defaultValue: ''.padEnd(10, '0'), // Placeholder for case number
  })
  caseNumber!: string

  @HasMany(() => CommunicationChannelModel, 'caseId')
  communicationChannels!: CommunicationChannelModel[]

  @HasMany(() => AdvertModel, 'caseId')
  adverts!: AdvertModel[]

  static async createCommonAdvert(body: CreateCommonAdvertInternalDto) {
    this.logger.info('Creating common case', { context: LOGGING_CONTEXT })

    const channels =
      body.channels?.map((ch) => ({
        email: ch.email,
        name: ch?.name,
        phone: ch?.phone,
      })) ?? []

    await this.create(
      {
        applicationId: body.applicationId,
        communicationChannels: channels,
        adverts: body.publishingDates.map((date, i) => ({
          categoryId: body.categoryId,
          typeId: AdvertTypeIdEnum.COMMON_APPLICATION,
          scheduledAt: new Date(date),
          title: body.caption,
          html: body.html,
          version: mapIndexToVersion(i),
          commonAdvert: {
            caption: body.caption,
            signatureDate: new Date(body.signature.date),
            signatureLocation: body.signature.location,
            signatureName: body.signature.name,
          },
        })),
      },
      {
        include: [
          { model: CommunicationChannelModel },
          { model: AdvertModel, include: [{ model: CommonAdvertModel }] },
        ],
      },
    )
  }

  @BeforeDestroy
  static async softDeleteCase(instance: CaseModel) {
    const adverts = await AdvertModel.unscoped().findAll({
      attributes: ['id'],
      where: { caseId: instance.id },
    })

    const promises = adverts.map((advert) =>
      advert.update({ statusId: AdvertStatusIdEnum.WITHDRAWN }),
    )

    await Promise.all(promises)

    this.logger.info('Marked adverts as withdrawn', {
      caseId: instance.id,
      context: LOGGING_CONTEXT,
      advertIds: adverts.map((advert) => advert.id),
    })
  }

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
}
