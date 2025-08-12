import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../../lib/constants'
import { CourtDistrictModel } from '../../court-district/court-district.model'
import { TypeEnum } from '../../type/type.model'
import { ApplicationStatusEnum } from '../contants'
import { ApplicationDto } from '../dto/application.dto'
import { DeceasedApplicationDto } from './dto/deceased-application.dto'

export type DeceasedApplicationAttributes = {
  caseId: string
  status: ApplicationStatusEnum
  involvedPartyNationalId: string
  judgmentDate?: Date | null
  additionalText?: string | null
  liquidatorName?: string | null
  liquidatorLocation?: string | null
  liquidatorOnBehalfOf?: string | null
  settlementName?: string | null
  settlementNationalId?: string | null
  settlementAddress?: string | null
  settlementDateOfDeath?: Date | null
  divisionMeetingDate?: Date | null
  divisionMeetingLocation?: string | null
  signatureLocation?: string | null
  signatureDate?: Date | null
  publishingDates?: Date[] | null
  courtDistrictId?: string | null
}

export type DeceasedApplicationCreateAttributes =
  Partial<DeceasedApplicationAttributes>

@DefaultScope(() => ({
  include: [CourtDistrictModel],
  order: [['updatedAt', 'DESC']],
}))
@BaseTable({ tableName: LegalGazetteModels.DECEASED_APPLICATION })
export class DeceasedApplicationModel extends BaseModel<
  DeceasedApplicationAttributes,
  DeceasedApplicationCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_id',
  })
  caseId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationStatusEnum)),
    defaultValue: ApplicationStatusEnum.DRAFT,
    allowNull: false,
  })
  status!: ApplicationStatusEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'involved_party_national_id',
  })
  involvedPartyNationalId!: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'judgment_date',
  })
  judgmentDate?: Date | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'additional_text',
  })
  additionalText?: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'liquidator_name',
  })
  liquidatorName?: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'liquidator_location',
  })
  liquidatorLocation?: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'on_behalf_of_liquidator',
  })
  liquidatorOnBehalfOf?: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'settlement_name',
  })
  settlementName?: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'settlement_national_id',
  })
  settlementNationalId?: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'settlement_address',
  })
  settlementAddress?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'settlement_date_of_death',
  })
  settlementDateOfDeath?: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'division_meeting_date',
  })
  divisionMeetingDate?: Date | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'division_meeting_location',
  })
  divisionMeetingLocation?: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'signature_location',
  })
  signatureLocation?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'signature_date',
  })
  signatureDate?: Date | null

  @Column({
    type: DataType.ARRAY(DataType.DATE),
    allowNull: true,
    field: 'publishing_dates',
  })
  publishingDates?: Date[] | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'court_district_id',
  })
  @ForeignKey(() => CourtDistrictModel)
  courtDistrictId?: string | null

  @BelongsTo(() => CourtDistrictModel, {
    foreignKey: 'courtDistrictId',
  })
  courtDistrict?: CourtDistrictModel | null

  static fromModelToApplicationDto(
    model: DeceasedApplicationModel,
  ): ApplicationDto {
    return {
      id: model.id,
      caseId: model.caseId,
      nationalId: model.involvedPartyNationalId,
      status: model.status,
      title: `${TypeEnum.DECEASED_ADVERT}${model.settlementAddress ? ` - ${model.settlementAddress}` : ''}`,
      type: TypeEnum.DECEASED_ADVERT,
    }
  }

  fromModelToApplicationDto(): ApplicationDto {
    return DeceasedApplicationModel.fromModelToApplicationDto(this)
  }

  static fromModel(model: DeceasedApplicationModel): DeceasedApplicationDto {
    return {
      id: model.id,
      caseId: model.caseId,
      judgmentDate: model.judgmentDate?.toISOString(),
      additionalText: model.additionalText ?? undefined,
      status: model.status,
      courtDistrict: model.courtDistrict?.fromModel(),
      liquidator: model.liquidatorName ?? undefined,
      liquidatorLocation: model.liquidatorLocation ?? undefined,
      liquidatorOnBehalfOf: model.settlementName ?? undefined,
      settlementName: model.settlementName ?? undefined,
      settlementNationalId: model.settlementNationalId ?? undefined,
      settlementAddress: model.settlementAddress ?? undefined,
      settlementDateOfDeath: model.settlementDateOfDeath?.toISOString(),
      settlementMeetingDate: model.divisionMeetingDate?.toISOString(),
      settlementMeetingLocation: model.divisionMeetingLocation ?? undefined,
      publishingDates:
        model.publishingDates?.map((date) => date.toISOString()) ?? undefined,
      signatureDate: model.signatureDate?.toISOString(),
      signatureLocation: model.signatureLocation ?? undefined,
    }
  }

  fromModel(): DeceasedApplicationDto {
    return DeceasedApplicationModel.fromModel(this)
  }
}
