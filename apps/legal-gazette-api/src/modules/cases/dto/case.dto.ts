import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { DetailedDto } from '@dmr.is/legal-gazette/dto'
import { Paging, PagingQuery } from '@dmr.is/shared/dto'

import { CaseCategoryDto } from '../../case-category/dto/case-category.dto'
import { CaseStatusDto } from '../../case-status/dto/case-status.dto'
import { CaseTypeDto } from '../../case-type/dto/case-type.dto'
import { CreateCommunicationChannelDto } from '../../communication-channel/dto/communication-channel.dto'

export class CaseQueryDto extends PagingQuery {}

export class CreateCaseDto {
  @ApiProperty({ type: String })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => CreateCommunicationChannelDto)
  channels?: CreateCommunicationChannelDto[]

  @ApiProperty({ type: [String] })
  @IsArray()
  @Type(() => String)
  @ArrayMinSize(0)
  @ArrayMaxSize(3)
  @Transform(({ value }: { value: string[] }) =>
    value.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
  )
  publishingDates!: string[]
}

export class CaseDto extends DetailedDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  applicationId?: string

  @ApiProperty({ type: String })
  @IsString()
  caseNumber!: string

  @ApiProperty({ type: String, nullable: true })
  @IsDateString()
  schedueledAt!: string | null

  @ApiProperty({ type: CaseTypeDto })
  @Type(() => CaseTypeDto)
  @ValidateNested()
  type!: CaseTypeDto

  @ApiProperty({ type: CaseCategoryDto })
  @Type(() => CaseCategoryDto)
  @ValidateNested()
  category!: CaseCategoryDto

  @ApiProperty({ type: CaseStatusDto })
  @Type(() => CaseStatusDto)
  @ValidateNested()
  status!: CaseStatusDto

  @ApiProperty({ type: String })
  @IsString()
  title!: string
}

export class GetCasesDto {
  @ApiProperty({ type: [CaseDto] })
  @IsArray()
  @Type(() => CaseDto)
  @ValidateNested({ each: true })
  cases!: CaseDto[]

  @ApiProperty({ type: Paging })
  @Type(() => Paging)
  @ValidateNested()
  paging!: Paging
}
