import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import {
  ApplicationTypeEnum,
  CommonApplicationFieldsSchema,
  RecallBankruptcyApplicationFieldsSchema,
  RecallDeceasedApplicationFieldsSchema,
} from '@dmr.is/legal-gazette/schemas'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { CaseModel } from './case.model'
import { CategoryModel } from './category.model'
import { TypeModel } from './type.model'

export enum ApplicationStatusEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  FINISHED = 'FINISHED',
}

export enum ApplicationRequirementStatementEnum {
  LIQUIDATORLOCATION = 'LIQUIDATOR_LOCATION',
  CUSTOMLIQUIDATORLOCATION = 'CUSTOM_LIQUIDATOR_LOCATION',
  CUSTOMLIQUIDATOREMAIL = 'CUSTOM_LIQUIDATOR_EMAIL',
}
export enum IslandIsCommonApplicationEventsEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

type BaseApplicationAttributes = {
  caseId: string
  submittedByNationalId: string
  type: ApplicationTypeEnum
  status: ApplicationStatusEnum
}

type ApplicationAttributes = BaseApplicationAttributes &
  (
    | ({
        type: ApplicationTypeEnum.COMMON
      } & { answers: CommonApplicationFieldsSchema })
    | ({
        type: ApplicationTypeEnum.RECALL_BANKRUPTCY
      } & { answers: RecallBankruptcyApplicationFieldsSchema })
    | ({
        type: ApplicationTypeEnum.RECALL_DECEASED
      } & { answers: RecallDeceasedApplicationFieldsSchema })
  )

type ApplicationCreateAttributes = ApplicationAttributes

@BaseTable({ tableName: LegalGazetteModels.APPLICATION })
@DefaultScope(() => ({
  include: [
    { model: CategoryModel, as: 'category' },
    { model: TypeModel, as: 'type' },
  ],
  order: [['createdAt', 'DESC']],
}))
export class ApplicationModel extends BaseModel<
  ApplicationAttributes,
  ApplicationCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  @ApiProperty({ type: String })
  caseId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  submittedByNationalId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationTypeEnum)),
    allowNull: false,
  })
  @ApiProperty({ enum: ApplicationTypeEnum, enumName: 'ApplicationTypeEnum' })
  type!: ApplicationTypeEnum

  @ApiProperty({
    enum: ApplicationStatusEnum,
    enumName: 'ApplicationStatusEnum',
  })
  status!: ApplicationStatusEnum

  @ApiProperty({ type: DataType.JSONB, default: {} })
  answers!: ApplicationAttributes

  getAnswers() {
    return this.answers
  }

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  get title() {
    if (this.type === ApplicationTypeEnum.RECALL_DECEASED) {
      return 'Innköllun dánarbús'
    }

    if (this.type === ApplicationTypeEnum.RECALL_BANKRUPTCY) {
      return 'Innköllun þrotabús'
    }

    return 'Almenn umsókn'
  }

  static fromModel(model: ApplicationModel) {
    return {
      id: model.id,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      caseId: model.caseId,
      submittedByNationalId: model.submittedByNationalId,
      status: model.status,
      title: model.title,
      type: model.type,
    }
  }

  fromModel() {
    return ApplicationModel.fromModel(this)
  }

  static fromModelToDetailedDto(model: ApplicationModel) {
    return {
      id: model.id,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      caseId: model.caseId,
      submittedByNationalId: model.submittedByNationalId,
      status: model.status,
      title: model.title,
      type: model.type,
    }
  }

  fromModelToDetailedDto() {
    return ApplicationModel.fromModelToDetailedDto(this)
  }
}

const test: ApplicationAttributes = {
  caseId: 'some-uuid',
  submittedByNationalId: '1234567890',
  type: ApplicationTypeEnum.COMMON,
  status: ApplicationStatusEnum.DRAFT,
  answers: {
    caption: 'Some caption',
  },
}
