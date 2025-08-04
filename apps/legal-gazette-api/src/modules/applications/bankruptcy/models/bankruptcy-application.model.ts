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
  caseId: string
  status: ApplicationStatusEnum
  involvedPartyNationalId: string
  courtDistrictId?: string

  additionalText?: string
  judgmentDate?: Date

  signatureLocation?: string
  signatureDate?: Date

  liquidator?: string
  liquidatorLocation?: string
  liquidatorOnBehalfOf?: string

  settlementName?: string
  settlementDeadline?: string
  settlementAddress?: string
  settlementNationalId?: string

  settlementMeetingLocation?: string
  settlementMeetingDate?: Date

  publishingDates?: Date[]
}

type BankruptcyApplicationCreationAttributes = BankruptcyApplicationAttributes

@DefaultScope(() => ({
  include: [{ model: CourtDistrictModel }],
  order: [['updatedAt', 'DESC']],
}))
@BaseTable({ tableName: LegalGazetteModels.BANKRUPTCY_APPLICATION })
export class BankruptcyApplicationModel extends BaseModel<
  BankruptcyApplicationAttributes,
  BankruptcyApplicationCreationAttributes
> {
  @Column({
    type: DataType.STRING,
    field: 'case_id',
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

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
        judgmentDate: dto.judgmentDate ? new Date(dto.judgmentDate) : undefined,
        signatureLocation: dto.signatureLocation,
        signatureDate: dto.signatureDate
          ? new Date(dto.signatureDate)
          : undefined,
        publishingDates: dto.publishingDates?.map((date) => new Date(date)),
        settlementName: dto.settlementName,
        settlementDeadline: dto.settlementDeadline,
        settlementAddress: dto.settlementAddress,
        settlementNationalId: dto.settlementNationalId,
        settlementMeetingDate: dto.settlementMeetingDate
          ? new Date(dto.settlementMeetingDate)
          : undefined,
        settlementMeetingLocation: dto.settlementMeetingLocation,
        liquidator: dto.liquidator,
        liquidatorLocation: dto.liquidatorLocation,
        liquidatorOnBehalfOf: dto.liquidatorOnBehalfOf,
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
      signatureLocation: model.signatureLocation,
      signatureDate: model.signatureDate?.toISOString(),
      publishingDates: model.publishingDates?.map((d) => d.toISOString()),
      settlementName: model.settlementName,
      settlementDeadline: model.settlementDeadline?.toISOString(),
      settlementAddress: model.settlementAddress,
      settlementNationalId: model.settlementNationalId,
      settlementMeetingDate: model.settlementMeetingDate?.toISOString(),
      settlementMeetingLocation: model.settlementMeetingLocation,
      liquidator: model.liquidator,
      liquidatorLocation: model.liquidatorLocation,
      liquidatorOnBehalfOf: model.liquidatorOnBehalfOf,
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
      title: `${TypeEnum.BANKRUPTCY_ADVERT}${model.settlementAddress ? ` - ${model.settlementAddress}` : ''}`,
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
