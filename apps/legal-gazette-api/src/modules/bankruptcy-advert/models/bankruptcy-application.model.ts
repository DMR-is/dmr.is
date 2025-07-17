import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { NotFoundException } from '@nestjs/common'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { CaseModel } from '../../case/case.model'
import { CourtDistrictModel } from '../../court-district/court-district.model'
import { BankruptcyApplicationDto } from '../dto/bankruptcy-application.dto'
import { UpdateBankruptcyApplicationDto } from '../dto/update-bankruptcy-application.dto'

type BankruptcyApplicationAttributes = {
  additionalText?: string | null
  judgmentDate?: Date | null
  claimsSentTo?: string | null
  signatureLocation?: string | null
  signatureDate?: Date | null
  signatureName?: string | null
  signatureOnBehalfOf?: string | null
  locationName?: string | null
  locationDeadline?: string | null
  locationAddress?: string | null
  locationNationalId?: string | null
  publishingDates?: Date[] | null
  courtDistrictId?: string | null
  caseId: string
}

type BankruptcyApplicationCreationAttributes = BankruptcyApplicationAttributes

@DefaultScope(() => ({
  attributes: [
    'additionalText',
    'judgmentDate',
    'claimsSentTo',
    'signatureLocation',
    'signatureDate',
    'signatureName',
    'signatureOnBehalfOf',
    'locationName',
    'locationDeadline',
    'locationAddress',
    'locationNationalId',
    'publishingDates',
    'courtDistrictId',
    'caseId',
  ],
  include: [
    {
      model: CourtDistrictModel,
      as: 'courtDistrict',
      attributes: ['id', 'title', 'slug'],
    },
  ],
}))
@BaseTable({ tableName: LegalGazetteModels.BANKRUPTCY_APPLICATION })
export class BankruptcyApplicationModel extends BaseModel<
  BankruptcyApplicationAttributes,
  BankruptcyApplicationCreationAttributes
> {
  @Column({
    type: DataType.TEXT,
    field: 'additional_text',
    allowNull: true,
    defaultValue: null,
  })
  additionalText!: string | null

  @Column({
    type: DataType.DATE,
    field: 'judgment_date',
    allowNull: true,
    defaultValue: null,
  })
  judgmentDate!: Date | null

  @Column({
    type: DataType.STRING,
    field: 'claims_sent_to',
    allowNull: true,
    defaultValue: null,
  })
  claimsSentTo!: string | null

  @Column({
    type: DataType.STRING,
    field: 'signature_location',
    allowNull: true,
    defaultValue: null,
  })
  signatureLocation!: string | null

  @Column({
    type: DataType.DATE,
    field: 'signature_date',
    allowNull: true,
    defaultValue: null,
  })
  signatureDate!: Date | null

  @Column({
    type: DataType.STRING,
    field: 'signature_name',
    allowNull: true,
    defaultValue: null,
  })
  signatureName!: string | null

  @Column({
    type: DataType.STRING,
    field: 'signature_on_behalf_of',
    allowNull: true,
    defaultValue: null,
  })
  signatureOnBehalfOf!: string | null

  @Column({
    type: DataType.ARRAY(DataType.DATE),
    field: 'publishing_dates',
    allowNull: true,
    defaultValue: null,
  })
  publishingDates!: Date[] | null

  @Column({
    type: DataType.STRING,
    field: 'location_name',
    allowNull: true,
    defaultValue: null,
  })
  locationName!: string | null

  @Column({
    type: DataType.STRING,
    field: 'location_deadline',
    allowNull: true,
    defaultValue: null,
  })
  locationDeadline!: string | null

  @Column({
    type: DataType.STRING,
    field: 'location_address',
    allowNull: true,
    defaultValue: null,
  })
  locationAddress!: string | null

  @Column({
    type: DataType.STRING,
    field: 'location_national_id',
    allowNull: true,
    defaultValue: null,
  })
  locationNationalId!: string | null

  @Column({
    type: DataType.STRING,
    field: 'court_district_id',
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => CourtDistrictModel)
  courtDistrictId!: string | null

  @Column({
    type: DataType.STRING,
    field: 'case_id',
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @BelongsTo(() => CourtDistrictModel, { foreignKey: 'courtDistrictId' })
  courtDistrict?: CourtDistrictModel

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  static async updateFromDto(
    caseId: string,
    dto: UpdateBankruptcyApplicationDto,
  ): Promise<BankruptcyApplicationModel> {
    const model = await BankruptcyApplicationModel.findOne({
      where: { caseId },
    })

    if (!model) {
      throw new NotFoundException(
        `Bankruptcy application with caseId ${caseId} not found`,
      )
    }

    return model.update({
      additionalText: dto.additionalText,
      judgmentDate: dto.judgmentDate ? new Date(dto.judgmentDate) : null,
      claimsSentTo: dto.claimsSentTo,
      signatureLocation: dto.signatureLocation,
      signatureDate: dto.signatureDate ? new Date(dto.signatureDate) : null,
      signatureName: dto.signatureName,
      signatureOnBehalfOf: dto.signatureOnBehalfOf,
      publishingDates: dto.publishingDates?.map((date) => new Date(date)),
      locationName: dto.locationName,
      locationDeadline: dto.locationDeadline,
      locationAddress: dto.locationAddress,
      locationNationalId: dto.locationNationalId,
      courtDistrictId: dto.courtDistrictId,
    })
  }

  static fromModel(
    model: BankruptcyApplicationModel,
  ): BankruptcyApplicationDto {
    return {
      additionalText: model.additionalText,
      judgmentDate: model.judgmentDate,
      claimsSentTo: model.claimsSentTo,
      signatureLocation: model.signatureLocation,
      signatureDate: model.signatureDate,
      signatureName: model.signatureName,
      signatureOnBehalfOf: model.signatureOnBehalfOf,
      publishingDates: model.publishingDates,
      locationName: model.locationName,
      locationDeadline: model.locationDeadline,
      locationAddress: model.locationAddress,
      locationNationalId: model.locationNationalId,
      courtDistrict: model?.courtDistrict?.fromModel(),
      caseId: model.caseId,
    }
  }

  fromModel(): BankruptcyApplicationDto {
    return BankruptcyApplicationModel.fromModel(this)
  }
}
