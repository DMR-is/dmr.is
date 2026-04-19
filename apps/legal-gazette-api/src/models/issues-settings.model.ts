import { Column, DataType } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { ApiString, ApiUUId } from '@dmr.is/decorators'
import { ParanoidModel, ParanoidTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'

export interface IssueSettingsAttributes {
  districtCommissioner: string
}

type IssueCreateAttributes = IssueSettingsAttributes

@ParanoidTable({ tableName: LegalGazetteModels.DOCUMENT_ISSUE_SETTINGS })
export class IssueSettingsModel extends ParanoidModel<
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
  @ApiUUId()
  id!: string

  @ApiString()
  districtCommissioner!: string
}
