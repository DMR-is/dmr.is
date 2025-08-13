import { DestroyOptions } from 'sequelize'
import {
  BeforeBulkDestroy,
  BeforeBulkUpdate,
  BeforeDestroy,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BadRequestException } from '@nestjs/common'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { ApplicationTypeEnum, LegalGazetteModels } from '../../../lib/constants'
import { CaseModel } from '../../case/case.model'
import { CourtDistrictModel } from '../../court-district/court-district.model'
import { ApplicationStatusEnum } from '../contants'
import { ApplicationDto } from '../dto/application.dto'
import { RecallApplicationDto } from './dto/recall-application.dto'

type RecallApplicationAttributes = {
  caseId: string
  type: ApplicationTypeEnum
  involvedPartyNationalId: string
  status?: ApplicationStatusEnum | null
  courtDistrictId?: string | null
  additionalText?: string | null
  judgmentDate?: Date | null
  signatureLocation?: string | null
  signatureDate?: Date | null
  liquidator?: string | null
  liquidatorLocation?: string | null
  liquidatorOnBehalfOf?: string | null
  settlementName?: string | null
  settlementDeadline?: Date | null
  settlementAddress?: string | null
  settlementNationalId?: string | null
  settlementMeetingLocation?: string | null
  settlementMeetingDate?: Date | null
  settlementDateOfDeath?: Date | null
  publishingDates?: Date[] | null
}

export type RecallApplicationCreateAttributes = Omit<
  RecallApplicationAttributes,
  'caseId'
> & {
  caseId?: string
}

@DefaultScope(() => ({
  include: [{ model: CourtDistrictModel }],
  order: [['updatedAt', 'DESC']],
}))
@BaseTable({ tableName: LegalGazetteModels.RECALL_APPLICATION })
export class RecallApplicationModel extends BaseModel<
  RecallApplicationAttributes,
  RecallApplicationCreateAttributes
> {
  @Column({
    type: DataType.STRING,
    field: 'case_id',
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationTypeEnum)),
    allowNull: false,
  })
  type!: ApplicationTypeEnum

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationStatusEnum)),
    allowNull: false,
    defaultValue: ApplicationStatusEnum.DRAFT,
    field: 'status',
  })
  status!: ApplicationStatusEnum

  @Column({
    type: DataType.STRING,
    field: 'involved_party_national_id',
    allowNull: false,
  })
  involvedPartyNationalId!: string

  @Column({
    type: DataType.TEXT,
    field: 'additional_text',
  })
  additionalText?: string

  @Column({
    type: DataType.DATE,
    field: 'judgment_date',
  })
  judgmentDate?: Date

  @Column({
    type: DataType.STRING,
    field: 'signature_location',
  })
  signatureLocation?: string

  @Column({
    type: DataType.DATE,
    field: 'signature_date',
  })
  signatureDate?: Date

  @Column({
    type: DataType.STRING,
    field: 'liquidator_name',
  })
  liquidator?: string

  @Column({
    type: DataType.STRING,
    field: 'liquidator_location',
  })
  liquidatorLocation?: string

  @Column({
    type: DataType.STRING,
    field: 'on_behalf_of_liquidator',
  })
  liquidatorOnBehalfOf?: string

  @Column({
    type: DataType.STRING,
    field: 'settlement_name',
  })
  settlementName?: string

  @Column({
    type: DataType.STRING,
    field: 'settlement_national_id',
  })
  settlementNationalId?: string

  @Column({
    type: DataType.STRING,
    field: 'settlement_address',
  })
  settlementAddress?: string

  @Column({
    type: DataType.STRING,
    field: 'settlement_deadline_date',
  })
  settlementDeadline?: Date

  @Column({
    type: DataType.STRING,
    field: 'division_meeting_location',
  })
  settlementMeetingLocation?: string

  @Column({
    type: DataType.DATE,
    field: 'division_meeting_date',
  })
  settlementMeetingDate?: Date

  @Column({
    type: DataType.DATE,
    field: 'settlement_date_of_death',
  })
  settlementDateOfDeath?: Date

  @Column({
    type: DataType.ARRAY(DataType.DATE),
    field: 'publishing_dates',
  })
  publishingDates?: Date[]

  @Column({
    type: DataType.STRING,
    field: 'court_district_id',
  })
  @ForeignKey(() => CourtDistrictModel)
  courtDistrictId?: string

  @BelongsTo(() => CourtDistrictModel, { foreignKey: 'courtDistrictId' })
  courtDistrict?: CourtDistrictModel

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  get title(): string {
    const settlementAddress = this.getDataValue('settlementAddress')
    const prefix =
      this.type === ApplicationTypeEnum.BANKRUPTCY
        ? 'Innköllun þrotabús'
        : 'Innköllun dánarbús'

    return `${prefix}${settlementAddress ? ` - ${settlementAddress}` : ''}`.trim()
  }

  static fromModel(model: RecallApplicationModel): RecallApplicationDto {
    return {
      id: model.id,
      status: model.status,
      type: model.type,
      additionalText: model.additionalText,
      judgmentDate: model.judgmentDate?.toISOString(),
      signatureLocation: model.signatureLocation,
      signatureDate: model.signatureDate?.toISOString(),
      publishingDates: model.publishingDates?.map((d) => d.toISOString()),
      settlementName: model.settlementName,
      settlementDeadline: model.settlementDeadline?.toISOString(),
      settlementAddress: model.settlementAddress,
      settlementNationalId: model.settlementNationalId,
      settlementMeetingDate: model.settlementMeetingDate?.toISOString(),
      settlementMeetingLocation: model.settlementMeetingLocation,
      settlementDateOfDeath: model.settlementDateOfDeath?.toISOString(),
      liquidator: model.liquidator,
      liquidatorLocation: model.liquidatorLocation,
      liquidatorOnBehalfOf: model.liquidatorOnBehalfOf ?? undefined,
      courtDistrict: model?.courtDistrict?.fromModel(),
      caseId: model.caseId,
    }
  }

  fromModel(): RecallApplicationDto {
    return RecallApplicationModel.fromModel(this)
  }

  static fromModelToApplicationDto(
    model: RecallApplicationModel,
  ): ApplicationDto {
    return {
      id: model.id,
      caseId: model.caseId,
      nationalId: model.involvedPartyNationalId,
      status: model.status,
      type: model.type,
      title: model.title,
    }
  }

  fromModelToApplicationDto(): ApplicationDto {
    return RecallApplicationModel.fromModelToApplicationDto(this)
  }

  @BeforeUpdate
  static async validateUpdate(model: RecallApplicationModel) {
    if (model.status !== ApplicationStatusEnum.DRAFT) {
      throw new BadRequestException(
        'Cannot update application that is not in draft status',
      )
    }
  }

  @BeforeBulkUpdate
  static async validateBulkUpdate(options: DestroyOptions) {
    options.individualHooks = true

    return options
  }

  @BeforeDestroy
  static async deleteApplication(model: RecallApplicationModel) {
    if (model.status !== ApplicationStatusEnum.DRAFT) {
      throw new BadRequestException(
        'Cannot delete application that is not in draft status',
      )
    }
  }

  @BeforeBulkDestroy
  static async deleteApplications(options: DestroyOptions) {
    options.individualHooks = true

    return options
  }
}
