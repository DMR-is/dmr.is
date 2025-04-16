import { IsOptional } from 'class-validator'

import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger'

import { AddCaseAdvertCorrection } from './add-case-advert-correction.dto'

export class UpdateAdvertHtmlBody {
  @ApiProperty({
    type: String,
    description: 'Advert HTML',
  })
  advertHtml!: string
}
export class UpdateAdvertAppendixBody {
  @ApiProperty({
    type: String,
    description: 'Advert appendix ID',
  })
  additionId!: string

  @ApiProperty({
    type: String,
    description: 'Advert appendix HTML',
    nullable: true,
  })
  @IsOptional()
  content?: string

  @ApiProperty({
    type: String,
    description: 'Advert appendix title',
    nullable: true,
  })
  @IsOptional()
  title?: string

  @ApiProperty({
    type: String,
    description: 'Advert appendix order',
    nullable: true,
  })
  @IsOptional()
  order?: string
}
export class DeleteAdvertAppendixBody {
  @ApiProperty({
    type: String,
    description: 'Advert appendix ID',
  })
  additionId!: string
}

export class UpdateAdvertHtmlCorrection extends IntersectionType(
  UpdateAdvertHtmlBody,
  OmitType(AddCaseAdvertCorrection, ['documentHtml', 'documentPdfUrl']),
) {}

export class CreateAdvertAppendixBody {
  @ApiProperty({
    type: String,
    description: 'Advert appendix HTML',
  })
  content!: string

  @ApiProperty({
    type: String,
    description: 'Advert appendix title',
  })
  title!: string
}
