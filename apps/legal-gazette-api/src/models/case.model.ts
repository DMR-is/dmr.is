import { Type } from 'class-transformer'
import { IsArray, IsString, ValidateNested } from 'class-validator'
import { Op } from 'sequelize'
import {
  BeforeCreate,
  BeforeDestroy,
  Column,
  DataType,
  DefaultScope,
  HasMany,
  HasOne,
} from 'sequelize-typescript'

import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'

import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import { Paging, PagingQuery } from '@dmr.is/shared/dto'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { DetailedDto } from '../core/dto/detailed.dto'
import { AdvertCreateAttributes, AdvertModel } from './advert.model'
import {
  ApplicationCreateAttributes,
  ApplicationModel,
} from './application.model'
import { StatusIdEnum } from './status.model'

type CaseAttributes = {
  caseNumber: string
  assignedUserId: string | null
  involvedPartyNationalId: string
  adverts: AdvertModel[]
  application?: ApplicationModel
}

type CaseCreateAttributes = {
  involvedPartyNationalId: string
  caseId?: string
  assignedUserId?: string | null
  adverts?: AdvertCreateAttributes[]
  application?: ApplicationCreateAttributes
}

@BaseTable({ tableName: LegalGazetteModels.CASE })
@DefaultScope(() => ({
  attributes: ['id', 'caseNumber', 'createdAt', 'updatedAt', 'deletedAt'],
  include: [
    {
      model: ApplicationModel,
      attributes: ['id', 'applicationType', 'status'],
    },
  ],
  order: [['createdAt', 'DESC']],
}))
export class CaseModel extends BaseModel<CaseAttributes, CaseCreateAttributes> {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'case_number',
    defaultValue: ''.padEnd(10, '0'), // Placeholder for case number
  })
  @ApiProperty({ type: String })
  caseNumber!: string

  @Column({
    type: DataType.TEXT,
    field: 'involved_party_national_id',
    allowNull: false,
  })
  @ApiProperty({ type: String })
  involvedPartyNationalId!: string

  @HasMany(() => AdvertModel, 'caseId')
  adverts!: AdvertModel[]

  @HasOne(() => ApplicationModel)
  application?: ApplicationModel

  @BeforeDestroy
  static async markAdvertsAsWithdrawn(instance: CaseModel) {
    const adverts = await AdvertModel.findAll({
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
    return {
      id: model.id,
      caseNumber: model.caseNumber,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      deletedAt: model.deletedAt?.toISOString(),
      applicationType: model.application?.applicationType ?? undefined,
    }
  }

  fromModel(): CaseDto {
    return CaseModel.fromModel(this)
  }
}

export class CaseQueryDto extends PagingQuery {}

export class CreateCaseDto {
  @ApiProperty({ type: String })
  @IsString()
  involvedPartyNationalId!: string
}

export class CaseDto extends IntersectionType(
  DetailedDto,
  PickType(CaseModel, ['id', 'caseNumber'] as const),
) {
  @ApiProperty({
    enum: ApplicationTypeEnum,
    required: false,
    enumName: 'ApplicationTypeEnum',
  })
  applicationType?: ApplicationTypeEnum
}

export class GetCasesDto {
  @ApiProperty({ type: [CaseDto] })
  @IsArray()
  @Type(() => CaseDto)
  @ValidateNested({ each: true })
  cases!: CaseDto[]

  @ApiProperty({ type: Paging })
  @Type(() => Paging)
  @ValidateNested()
  paging!: Paging
}
