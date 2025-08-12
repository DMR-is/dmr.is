import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { CourtDistrictModel } from '../../court-district/court-district.model'
import { TypeEnum } from '../../type/type.model'
import { ApplicationStatusEnum } from '../contants'
import { ApplicationDto } from '../dto/application.dto'

type DeceasedApplicationAttributes = {
  caseId: string
  status: ApplicationStatusEnum
  involvedPartyNationalId: string
  judgmentDate?: Date | null
  additionalText?: string | null
  liquidatorName?: string | null
  liquidatorLocation?: string | null
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

type DeceasedApplicationCreateAttributes =
  Partial<DeceasedApplicationAttributes>

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
}
