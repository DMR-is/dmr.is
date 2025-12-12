import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'
import { Column, DataType } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { Paging, PagingQuery } from '@dmr.is/shared/dto'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

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
      publishDate: model.publishDate.toISOString(),
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

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isLegacy!: boolean

  @ApiProperty({ type: String })
  @IsString()
  hash!: string
}

export class GetIssuesDto {
  @ApiProperty({
    type: [IssueDto],
  })
  issues!: IssueDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class GetIssuesQuery extends PagingQuery {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  year?: string
}
