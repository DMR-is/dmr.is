import { plainToInstance } from 'class-transformer'
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

import {
  ApplicationTypeEnum,
  LegalGazetteModels,
} from '../../../../lib/constants'
import { CaseModel } from '../../../case/case.model'
import { CategoryModel } from '../../../category/category.model'
import { ApplicationStatusEnum } from '../../contants'
import { ApplicationDto } from '../../dto/application.dto'
import { CommonApplicationDto } from './dto/common-application.dto'

export type CommonApplicationAttributes = {
  caseId: string
  involvedPartyNationalId: string
  status: ApplicationStatusEnum
  categoryId?: string | null
  caption?: string | null
  html?: string | null
  signatureName?: string | null
  signatureLocation?: string | null
  signatureDate?: Date | null
  publishingDates?: Date[]
}

export type CommonApplicationCreateAttributes = Omit<
  CommonApplicationAttributes,
  'caseId' | 'status'
> & {
  caseId?: string
  status?: ApplicationStatusEnum
}

@DefaultScope(() => ({
  include: [
    {
      model: CategoryModel,
      required: false,
    },
  ],
  order: [
    ['status', 'ASC'],
    ['updatedAt', 'DESC'],
  ],
}))
@BaseTable({ tableName: LegalGazetteModels.COMMON_APPLICATION })
export class CommonApplicationModel extends BaseModel<
  CommonApplicationAttributes,
  CommonApplicationCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_id',
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    field: 'involved_party_national_id',
  })
  involvedPartyNationalId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationStatusEnum)),
    allowNull: false,
    defaultValue: ApplicationStatusEnum.DRAFT,
  })
  status!: ApplicationStatusEnum

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'category_id',
  })
  @ForeignKey(() => CategoryModel)
  categoryId?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  caption?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  html?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'signature_name',
  })
  signatureName?: string | null

  @Column({
    type: DataType.TEXT,
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
  publishingDates?: Date[]

  get title(): string {
    return `Almenn umsókn${this.caption ? ` - ${this.caption}` : ''}`
  }

  @BelongsTo(() => CategoryModel, {
    foreignKey: 'categoryId',
  })
  category?: CategoryModel

  @BelongsTo(() => CaseModel, {
    foreignKey: 'caseId',
  })
  case?: CaseModel

  static fromModel(model: CommonApplicationModel): CommonApplicationDto {
    const dto = {
      id: model.id,
      caseId: model.caseId,
      title: model.title,
      involvedPartyNationalId: model.involvedPartyNationalId,
      status: model.status,
      categoryId: model.categoryId,
      caption: model.caption,
      html: model.html,
      signatureName: model.signatureName,
      signatureLocation: model.signatureLocation,
      signatureDate: model.signatureDate
        ? model.signatureDate.toISOString()
        : model.signatureDate,
      publishingDates: model.publishingDates?.map((date) => date.toISOString()),
    }

    const transformed = plainToInstance(CommonApplicationDto, dto)

    return transformed
  }

  fromModel(): CommonApplicationDto {
    return CommonApplicationModel.fromModel(this)
  }

  static fromModelToApplicationDto(
    model: CommonApplicationModel,
  ): ApplicationDto {
    return {
      id: model.id,
      caseId: model.caseId,
      title: model.title,
      applicationType: ApplicationTypeEnum.COMMON,
      status: model.status,
      nationalId: model.involvedPartyNationalId,
    }
  }

  fromModelToApplicationDto(): ApplicationDto {
    return CommonApplicationModel.fromModelToApplicationDto(this)
  }

  @BeforeUpdate
  static async validateUpdate(model: CommonApplicationModel) {
    if (model.previous('status') !== ApplicationStatusEnum.DRAFT) {
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
  static async deleteApplication(model: CommonApplicationModel) {
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
