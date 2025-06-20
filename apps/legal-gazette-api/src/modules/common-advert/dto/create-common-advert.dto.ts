import { Transform, Type } from 'class-transformer'
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateCaseDto } from '../../case/dto/case.dto'

export class CreateCommonAdvertSignatureDto {
  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  location!: string

  @ApiProperty({ type: String })
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  date!: string
}

export class CreateCommonAdvertDto extends CreateCaseDto {
  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  caption!: string

  @ApiProperty({ type: String })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: CreateCommonAdvertSignatureDto })
  @ValidateNested()
  @Type(() => CreateCommonAdvertSignatureDto)
  signature!: CreateCommonAdvertSignatureDto
}

export class CreateCommonAdvertInternalDto extends CreateCommonAdvertDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  html?: string

  @ApiProperty({ type: String })
  @IsOptional()
  @IsUUID()
  applicationId?: string

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  submittedBy!: string
}
