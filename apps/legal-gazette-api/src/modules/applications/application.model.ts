import { Column, DataType, ForeignKey } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { CaseModel } from '../case/case.model'
import { CategoryModel } from '../category/category.model'
import { CommunicationChannelCreateAttributes } from '../communication-channel/communication-channel.model'
import { ApplicationStatusEnum } from './contants'

export type ApplicationAttributes = {
  submittedByNationalId: string
  status: ApplicationStatusEnum
}

export type ApplicationCreateAttributes = {
  caseId: string
  submittedByNationalId: string
  categoryId: string
}

@BaseTable({ tableName: LegalGazetteModels.APPLICATION })
export class ApplicationModel extends BaseModel<
  ApplicationAttributes,
  ApplicationCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_id',
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'submitted_by_national_id',
  })
  submittedByNationalId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'category_id',
  })
  @ForeignKey(() => CategoryModel)
  categoryId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationStatusEnum)),
    defaultValue: ApplicationStatusEnum.DRAFT,
    allowNull: false,
    field: 'status',
  })
  status!: ApplicationStatusEnum

  @Column({
    type: DataType.UUID,
    defaultValue: null,
    allowNull: true,
    field: 'court_district_id',
  })
  courtDistrictId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
    field: 'island_is_application_id',
  })
  islandIsApplicationId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'caption',
  })
  caption!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'additional_text',
  })
  additionalText!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'judgment_date',
  })
  judgmentDate!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'html',
  })
  html!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'signature_name',
  })
  signatureName!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'signature_on_behalf_of',
  })
  signatureOnBehalfOf!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'signature_location',
  })
  signatureLocation!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'signature_date',
  })
  signatureDate!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'settlement_name',
  })
  settlementName!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'settlement_national_id',
  })
  settlementNationalId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'settlement_address',
  })
  settlementAddress!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'settlement_deadline_date',
  })
  settlementDeadlineDate!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'settlement_date_of_death',
  })
  settlementDateOfDeath!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'division_meeting_date',
  })
  divisionMeetingDate!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
    field: 'division_meeting_location',
  })
  divisionMeetingLocation!: string | null

  @Column({
    type: DataType.ARRAY(DataType.DATE),
    allowNull: true,
    defaultValue: [],
    field: 'publishing_dates',
  })
  publishingDates!: Date[]

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'communication_channels',
  })
  communicationChannels!: CommunicationChannelCreateAttributes[]
}
