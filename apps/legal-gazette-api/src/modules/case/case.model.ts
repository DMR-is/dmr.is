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
import {
  BankruptcyApplicationCreateAttributes,
  BankruptcyApplicationModel,
} from '../applications/bankruptcy/bankruptcy-application.model'
import {
  DeceasedApplicationCreateAttributes,
  DeceasedApplicationModel,
} from '../applications/deceased/deceased-application.model'
import { CommonAdvertModel } from '../common-advert/common-advert.model'
import { CreateCommonAdvertInternalDto } from '../common-advert/dto/create-common-advert.dto'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from '../communication-channel/communication-channel.model'
import { StatusIdEnum } from '../status/status.model'
import { TypeIdEnum } from '../type/type.model'
import { UserModel } from '../users/users.model'
import { CaseDto } from './dto/case.dto'

type CaseAttributes = {
  caseNumber: string
  bankruptcyApplicationId: string | null
  deceasedApplicationId: string | null
  assignedUserId: string | null
  involvedPartyNationalId: string
  communicationChannels: CommunicationChannelModel[]
  adverts: AdvertModel[]
}

type CaseCreateAttributes = {
  involvedPartyNationalId: string
  bankruptcyApplicationId?: string
  caseId?: string
  assignedUserId?: string | null
  communicationChannels?: CommunicationChannelCreateAttributes[]
  adverts?: AdvertCreateAttributes[]
  bankruptcyApplication?: BankruptcyApplicationCreateAttributes
  deceasedApplication?: DeceasedApplicationCreateAttributes
}

@BaseTable({ tableName: LegalGazetteModels.CASE })
@DefaultScope(() => ({
  attributes: [
    'id',
    'bankruptcyApplicationId',
    'caseNumber',
    'createdAt',
    'updatedAt',
    'deletedAt',
  ],
  order: [['createdAt', 'DESC']],
}))
@Scopes(() => ({
  bybankruptcyApplicationId: (bankruptcyApplicationId: string) => ({
    attributes: ['id', 'bankruptcyApplicationId'],
    where: { bankruptcyApplicationId },
  }),
  applications: {
    where: {
      [Op.or]: [
        { bankruptcyApplicationId: { [Op.not]: null } },
        { deceasedApplicationId: { [Op.not]: null } },
      ],
    },
    include: [BankruptcyApplicationModel, DeceasedApplicationModel],
  },
}))
export class CaseModel extends BaseModel<CaseAttributes, CaseCreateAttributes> {
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'bankruptcy_application_id',
    defaultValue: null,
  })
  bankruptcyApplicationId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'deceased_application_id',
    defaultValue: null,
  })
  deceasedApplicationId!: string | null

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

  @HasOne(() => DeceasedApplicationModel, {
    foreignKey: 'caseId',
  })
  deceasedApplication?: DeceasedApplicationModel

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
            islandIsApplicationId: body.applicationId,
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

    const datePrefix = `${year}${month}${day}`

    // Get the latest (max) case number for the day
    const latestCase = await CaseModel.unscoped().findOne({
      where: {
        caseNumber: {
          [Op.like]: `${datePrefix}%`,
        },
      },
      order: [['caseNumber', 'DESC']],
      paranoid: false, // include soft-deleted cases to avoid reuse
    })

    let nextSequence = 1

    if (latestCase && latestCase.caseNumber) {
      const lastSequence = parseInt(latestCase.caseNumber.slice(8)) // last 3 digits
      nextSequence = lastSequence + 1
    }

    // Construct new case number
    instance.caseNumber = `${datePrefix}${String(nextSequence).padStart(3, '0')}`
  }

  static fromModel(model: CaseModel): CaseDto {
    try {
      if (!model) {
        throw new Error('Case model is undefined or null')
      }

      return {
        id: model.id,
        applicationId:
          model.bankruptcyApplicationId === null
            ? undefined
            : model.bankruptcyApplicationId,
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
}
