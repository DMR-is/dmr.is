import { Op } from 'sequelize'
import {
  BeforeCreate,
  BeforeDestroy,
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
import { BankruptcyApplicationModel } from '../applications/bankruptcy/models/bankruptcy-application.model'
import { CategoryModel } from '../category/category.model'
import { CommonAdvertModel } from '../common-advert/common-advert.model'
import { CreateCommonAdvertInternalDto } from '../common-advert/dto/create-common-advert.dto'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from '../communication-channel/communication-channel.model'
import { StatusIdEnum, StatusModel } from '../status/status.model'
import { TypeIdEnum, TypeModel } from '../type/type.model'
import { UserModel } from '../users/users.model'
import { CaseDetailedDto, CaseDto } from './dto/case.dto'

type CaseAttributes = {
  caseNumber: string
  applicationId: string | null
  assignedUserId: string | null
  communicationChannels: CommunicationChannelModel[]
  adverts: AdvertModel[]
}

type CaseCreateAttributes = {
  involvedPartyNationalId: string
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
        model: AdvertModel.unscoped(),
        scope: 'all',
        duplicating: false,
        separate: true,
        order: [['version', 'ASC']],
        include: [StatusModel, CategoryModel, TypeModel, CommonAdvertModel],
      },
      { model: UserModel },
      {
        model: BankruptcyApplicationModel,
        required: false,
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
  @ForeignKey(() => UserModel)
  assignedUserId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'case_number',
    defaultValue: ''.padEnd(10, '0'), // Placeholder for case number
  })
  caseNumber!: string

  @Column({
    type: DataType.TEXT,
    field: 'involved_party_national_id',
    allowNull: false,
  })
  involvedPartyNationalId!: string

  @HasMany(() => CommunicationChannelModel, 'caseId')
  communicationChannels!: CommunicationChannelModel[]

  @HasMany(() => AdvertModel, 'caseId')
  adverts!: AdvertModel[]

  @BelongsTo(() => UserModel, 'assignedUserId')
  assignedUser?: UserModel

  @HasOne(() => BankruptcyApplicationModel, {
    foreignKey: 'caseId',
  })
  bankruptcyApplication?: BankruptcyApplicationModel

  static async createCommonAdvert(body: CreateCommonAdvertInternalDto) {
    this.logger.info('Creating case for common advert')

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
        involvedPartyNationalId: body.involvedPartyNationalId,
        adverts: body.publishingDates.map((date, i) => ({
          categoryId: body.categoryId,
          statusId: StatusIdEnum.SUBMITTED,
          typeId: TypeIdEnum.COMMON_ADVERT,
          scheduledAt: new Date(date),
          title: body.caption,
          html: body.html,
          version: mapIndexToVersion(i),
          submittedBy: body.submittedBy,
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
  static async markAdvertsAsWithdrawn(instance: CaseModel) {
    const adverts = await AdvertModel.unscoped().findAll({
      attributes: ['id'],
      where: { caseId: instance.id },
    })

    const promises = adverts.map((advert) =>
      advert.update({ statusId: StatusIdEnum.WITHDRAWN }),
    )

    await Promise.all(promises)

    this.logger.info('Marked adverts as withdrawn', {
      caseId: instance.id,
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

  static fromModel(model: CaseModel): CaseDto {
    try {
      if (!model) {
        throw new Error('Case model is undefined or null')
      }

      return {
        id: model.id,
        applicationId:
          model.applicationId === null ? undefined : model.applicationId,
        caseNumber: model.caseNumber,
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
      }
    } catch (error) {
      this.logger.debug(
        `fromModel failed for CaseModel, did you include everything?`,
      )
      throw error
    }
  }

  fromModel(): CaseDto {
    return CaseModel.fromModel(this)
  }

  static fromModelDetailed(model: CaseModel): CaseDetailedDto {
    try {
      return {
        id: model.id,
        applicationId:
          model.applicationId === null ? undefined : model.applicationId,
        caseNumber: model.caseNumber,
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
        adverts: model.adverts.map((advert) =>
          AdvertModel.fromModelDetailed(advert),
        ),
        communicationChannels: model.communicationChannels.map((channel) => ({
          email: channel.email,
          phone: channel.phone ? channel.phone : undefined,
          name: channel.name ? channel.name : undefined,
        })),
        bankruptcyApplication: model.bankruptcyApplication?.fromModel(),
      }
    } catch (error) {
      this.logger.debug(
        `fromModelDetailed failed for CaseModel, did you include everything?`,
      )
      throw error
    }
  }

  fromModelDetailed(): CaseDetailedDto {
    return CaseModel.fromModelDetailed(this)
  }
}
