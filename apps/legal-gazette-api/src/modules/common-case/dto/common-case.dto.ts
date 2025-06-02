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

import { CreateCaseDto } from '../../cases/dto/case.dto'

export class SignatureDto {
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

export class CreateCommonCaseDto extends CreateCaseDto {
  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  caption!: string

  @ApiProperty({ type: String })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: SignatureDto })
  @ValidateNested()
  @Type(() => SignatureDto)
  signature!: SignatureDto
}

export class CreateCommonCaseInternalDto extends CreateCommonCaseDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  html?: string

  @ApiProperty({ type: String })
  @IsOptional()
  @IsUUID()
  applicationId?: string
}
