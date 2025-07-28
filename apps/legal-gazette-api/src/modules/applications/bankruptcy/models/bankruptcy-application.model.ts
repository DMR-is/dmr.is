import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BadRequestException } from '@nestjs/common'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { CaseModel } from '../../../case/case.model'
import { CourtDistrictModel } from '../../../court-district/court-district.model'
import { TypeEnum } from '../../../type/type.model'
import { ApplicationStatusEnum } from '../../contants'
import { ApplicationDto } from '../../dto/application.dto'
import { BankruptcyApplicationDto } from '../dto/bankruptcy-application.dto'
import { UpdateBankruptcyApplicationDto } from '../dto/update-bankruptcy-application.dto'

type BankruptcyApplicationAttributes = {
  involvedPartyNationalId: string
  status: ApplicationStatusEnum
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
  include: [
    {
      model: CourtDistrictModel,
      as: 'courtDistrict',
      attributes: ['id', 'title', 'slug'],
    },
  ],
  order: [['updatedAt', 'DESC']],
}))
@BaseTable({ tableName: LegalGazetteModels.BANKRUPTCY_APPLICATION })
export class BankruptcyApplicationModel extends BaseModel<
  BankruptcyApplicationAttributes,
  BankruptcyApplicationCreationAttributes
> {
  @Column({
    type: DataType.STRING,
    field: 'involved_party_national_id',
    allowNull: false,
  })
  involvedPartyNationalId!: string

  @Column({
    type: DataType.TEXT,
    field: 'additional_text',
    allowNull: true,
    defaultValue: null,
  })
  additionalText!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationStatusEnum)),
    allowNull: false,
    defaultValue: ApplicationStatusEnum.DRAFT,
    field: 'status',
  })
  status!: ApplicationStatusEnum

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
    field: 'location_deadline_date',
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

  /**
   *
   * @param caseId
   * @param applicationId
   * @param dto
   * @returns
   */
  static async updateFromDto(
    caseId: string,
    applicationId: string,
    dto: UpdateBankruptcyApplicationDto,
  ): Promise<BankruptcyApplicationModel> {
    const [_count, rows] = await BankruptcyApplicationModel.update(
      {
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
      },
      {
        returning: true,
        where: {
          id: applicationId,
          caseId,
        },
      },
    )

    return rows[0]
  }

  static fromModel(
    model: BankruptcyApplicationModel,
  ): BankruptcyApplicationDto {
    return {
      id: model.id,
      status: model.status,
      additionalText: model.additionalText,
      judgmentDate: model.judgmentDate?.toISOString(),
      claimsSentTo: model.claimsSentTo,
      signatureLocation: model.signatureLocation,
      signatureDate: model.signatureDate?.toISOString(),
      signatureName: model.signatureName,
      signatureOnBehalfOf: model.signatureOnBehalfOf,
      publishingDates: model.publishingDates?.map((d) => d.toISOString()),
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

  static fromModelToApplicationDto(
    model: BankruptcyApplicationModel,
  ): ApplicationDto {
    return {
      id: model.id,
      caseId: model.caseId,
      nationalId: model.involvedPartyNationalId,
      status: model.status,
      title: `${TypeEnum.BANKRUPTCY_ADVERT}${model.locationAddress ? ` - ${model.locationAddress}` : ''}`,
      type: TypeEnum.BANKRUPTCY_ADVERT,
    }
  }

  fromModelToApplicationDto(): ApplicationDto {
    return BankruptcyApplicationModel.fromModelToApplicationDto(this)
  }

  static async deleteApplication(
    model: BankruptcyApplicationModel,
  ): Promise<void> {
    if (model.status !== ApplicationStatusEnum.DRAFT) {
      throw new BadRequestException(
        'Cannot delete application that is not in draft status',
      )
    }

    await model.destroy({ force: true })
    await CaseModel.destroy({ where: { id: model.caseId }, force: true })
  }

  deleteApplication(): Promise<void> {
    return BankruptcyApplicationModel.deleteApplication(this)
  }
}
