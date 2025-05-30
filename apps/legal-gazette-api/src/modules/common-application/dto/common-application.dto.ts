import { Expose, Transform } from 'class-transformer'
import { IsBase64, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateCommonCaseDto } from '../../common-case/dto/common-case.dto'

export class SubmitCommonApplicationDto extends CreateCommonCaseDto {
  @ApiProperty({ type: String })
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
}
