import { Expose, Transform, Type } from 'class-transformer'
import {
  IsBase64,
  IsDefined,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateCommonAdvertDto } from '../../common-advert/dto/create-common-advert.dto'

enum CommonApplicationEventsEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class SubmitCommonApplicationActorDto {
  @ApiProperty({ type: String })
  @IsString()
  firstName!: string

  @ApiProperty({ type: String })
  @IsString()
  lastName!: string

  @ApiProperty({ type: String })
  @IsEmail()
  email!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  phone?: string
}

export class SubmitCommonApplicationInstitutionDto {
  @ApiProperty({ type: String })
  @IsString()
  title!: string
}

export class SubmitCommonApplicationDto extends CreateCommonAdvertDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  applicationId!: string

  @ApiProperty({ type: String })
  @IsBase64()
  htmlBase64!: string

  @Expose()
  @IsString()
  @Transform(({ obj }) =>
    Buffer.from(obj.htmlBase64, 'base64').toString('utf-8'),
  )
  html!: string

  @ApiProperty({ type: SubmitCommonApplicationActorDto, required: true })
  @IsDefined()
  @ValidateNested({ each: true })
  @Type(() => SubmitCommonApplicationActorDto)
  actor!: SubmitCommonApplicationActorDto

  @ApiProperty({ type: SubmitCommonApplicationInstitutionDto, required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SubmitCommonApplicationInstitutionDto)
  institution?: SubmitCommonApplicationInstitutionDto
}

export class CommonApplicationUpdateStateEvent {
  @ApiProperty({ type: String })
  @IsUUID()
  applicationId!: string

  @ApiProperty({
    enum: CommonApplicationEventsEnum,
    enumName: 'CommonApplicationEvents',
  })
  event!: CommonApplicationEventsEnum
}
