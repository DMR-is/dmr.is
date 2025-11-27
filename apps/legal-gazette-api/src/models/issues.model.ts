import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'
import { Column, DataType, HasMany } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'

export interface IssueAttributes {
  publishDate: Date
  title: string
  url: string
  issue: number
  year: number
  runningPageNumber: number
}

type IssueCreateAttributes = IssueAttributes

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

  static fromModel(model: IssueModel): IssueDto {
    return {
      id: model.id,
      publishDate: model.publishDate.toISOString(),
      title: model.title,
      url: model.url,
      issue: model.issue,
      year: model.year,
      runningPageNumber: model.runningPageNumber,
    }
  }

  fromModel(): IssueDto {
    return IssueModel.fromModel(this)
  }
}

export class IssueDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date and time when the issue was created',
  })
  @IsDateString()
  @IsOptional()
  createdAt?: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date and time when the issue was published',
  })
  @IsDateString()
  publishDate!: string

  @ApiProperty({ type: String })
  @IsString()
  title!: string

  @ApiProperty({ type: String })
  @IsString()
  url!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  issue!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  year!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  runningPageNumber!: number
}

export class GetIssuesDto {
  @ApiProperty({
    type: [IssueDto],
  })
  issues!: IssueDto[]
}
