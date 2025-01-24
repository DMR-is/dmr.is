import { IsOptional } from 'class-validator'

import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger'

import { AddCaseAdvertCorrection } from './add-case-advert-correction.dto'

export class UpdateAdvertHtmlBody {
  @ApiProperty({
    type: String,
    description: 'Advert HTML',
  })
  advertHtml!: string

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly documentPdfUrl?: string
}

export class UpdateAdvertHtmlCorrection extends IntersectionType(
  OmitType(UpdateAdvertHtmlBody, ['documentPdfUrl']),
  OmitType(AddCaseAdvertCorrection, ['documentHtml', 'documentPdfUrl']),
) {}
