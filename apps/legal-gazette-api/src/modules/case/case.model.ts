import { Op } from 'sequelize'
import {
  BeforeCreate,
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
import { AdvertTypeIdEnum } from '../advert-type/advert-type.model'
import { CommonAdvertModel } from '../common-advert/common-advert.model'
import { CreateCommonAdvertInternalDto } from '../common-advert/dto/common-advert.dto'
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
  order: [['createdAt', 'DESC']],
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

  @HasMany(() => CommunicationChannelModel)
  communicationChannels!: CommunicationChannelModel[]

  @HasMany(() => AdvertModel, 'caseId')
  adverts!: AdvertModel[]

  static async softDeleteCase(caseId: string) {
    this.logger.info('Marking case as deleted', {
      caseId,
      context: LOGGING_CONTEXT,
    })

    try {
      const caseInstance = await this.findByPk(caseId)

      if (!caseInstance) {
        this.logger.warn('No case found for deletion', {
          caseId,
          context: LOGGING_CONTEXT,
        })
        return
      }

      await caseInstance.destroy()
      this.logger.info('Case soft deleted successfully', {
        caseId,
        context: LOGGING_CONTEXT,
      })
    } catch (error) {
      this.logger.error('Error soft deleting case', {
        caseId,
        context: LOGGING_CONTEXT,
        error,
      })
      throw error
    }
  }

  static async createCommonAdvert(body: CreateCommonAdvertInternalDto) {
    this.logger.info('Creating common case', { context: LOGGING_CONTEXT })

    await this.create(
      {
        applicationId: body.applicationId,
        adverts: body.publishingDates.map((date, i) => ({
          categoryId: body.categoryId,
          typeId: AdvertTypeIdEnum.COMMON_APPLICATION,
          scheduledAt: new Date(date),
          title: body.caption,
          html: body.html,
          version: mapIndexToVersion(i),
          communicationChannels:
            body.channels?.map((ch) => ({
              email: ch.email,
              name: ch?.name,
              phone: ch?.phone,
            })) ?? [],
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
