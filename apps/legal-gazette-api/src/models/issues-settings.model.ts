import { IsString, IsUUID } from 'class-validator'
import { Column, DataType } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'

export interface IssueSettingsAttributes {
  districtCommissioner: string
}

type IssueCreateAttributes = IssueSettingsAttributes

@BaseTable({ tableName: LegalGazetteModels.DOCUMENT_ISSUE_SETTINGS })
export class IssueSettingsModel extends BaseModel<
  IssueSettingsAttributes,
  IssueCreateAttributes
> {
  @Column({ type: DataType.TEXT })
  districtCommissioner!: string

  static fromModel(model: IssueSettingsModel): IssueSettingsDto {
    return {
      id: model.id,
      districtCommissioner: model.districtCommissioner,
    }
  }

  fromModel(): IssueSettingsDto {
    return IssueSettingsModel.fromModel(this)
  }
}

export class IssueSettingsDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String })
  @IsString()
  districtCommissioner!: string
}

export class GetIssueSettingsDto {
  @ApiProperty({
    type: IssueSettingsDto,
  })
  issueSettings!: IssueSettingsDto
}
