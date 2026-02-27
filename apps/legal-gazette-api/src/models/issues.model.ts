import { Column, DataType } from 'sequelize-typescript'

import {
  ApiBoolean,
  ApiDateTime,
  ApiNumber,
  ApiOptionalDateTime,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'

export interface IssueAttributes {
  publishDate: Date
  title: string
  url: string
  issue: number
  year: number
  runningPageNumber: number
  isLegacy: boolean
  hash: string
}

type IssueCreateAttributes = Omit<IssueAttributes, 'isLegacy'> & {
  isLegacy?: boolean
}

@BaseTable({ tableName: LegalGazetteModels.DOCUMENT_ISSUES })
export class IssueModel extends BaseModel<
  IssueAttributes,
  IssueCreateAttributes
> {
  @Column({ type: DataType.DATE, allowNull: false })
  publishDate!: Date

  @Column({ type: DataType.TEXT })
  title!: string

  @Column({ type: DataType.TEXT })
  url!: string

  @Column({ type: DataType.INTEGER })
  issue!: number

  @Column({ type: DataType.INTEGER })
  year!: number

  @Column({ type: DataType.INTEGER })
  runningPageNumber!: number

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isLegacy!: boolean

  @Column({ type: DataType.TEXT })
  hash!: string

  static fromModel(model: IssueModel): IssueDto {
    return {
      id: model.id,
      publishDate: model.publishDate,
      title: model.title,
      url: model.url,
      issue: model.issue,
      year: model.year,
      runningPageNumber: model.runningPageNumber,
      isLegacy: model.isLegacy,
      hash: model.hash,
    }
  }

  fromModel(): IssueDto {
    return IssueModel.fromModel(this)
  }
}

export class IssueDto {
  @ApiUUId()
  id!: string

  @ApiOptionalDateTime({
    description: 'The date and time when the issue was created',
  })
  createdAt?: Date

  @ApiDateTime({
    description: 'The date and time when the issue was published',
  })
  publishDate!: Date

  @ApiString()
  title!: string

  @ApiString()
  url!: string

  @ApiNumber()
  issue!: number

  @ApiNumber()
  year!: number

  @ApiNumber()
  runningPageNumber!: number

  @ApiBoolean()
  isLegacy!: boolean

  @ApiString()
  hash!: string
}
