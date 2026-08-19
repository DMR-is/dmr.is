import { IsBooleanString, IsIn, IsOptional } from 'class-validator'

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Query parameters island.is sends on a Skjalaveita call. Shapes fixed by their
 * interface spec, not by us.
 */
export class PostholfDocumentQueryDto {
  @ApiPropertyOptional({
    enum: ['LOW', 'SUBSTANTIAL', 'HIGH'],
    description:
      'Assurance level the caller authenticated the user at. Recorded, not enforced — the document is the same at every level.',
  })
  @IsOptional()
  @IsIn(['LOW', 'SUBSTANTIAL', 'HIGH'])
  authenticationType?: 'LOW' | 'SUBSTANTIAL' | 'HIGH'

  @ApiPropertyOptional({
    type: String,
    description:
      'When "false", metadata is returned without the document body. Defaults to true.',
  })
  @IsOptional()
  @IsBooleanString()
  includeDocument?: string
}

/**
 * An action island.is may offer alongside the document. None are used yet; the
 * field exists because their spec requires it to be present.
 */
export class PostholfDocumentActionDto {
  @ApiProperty() type!: string
  @ApiProperty() title!: string
  @ApiPropertyOptional() data?: string
  @ApiPropertyOptional() icon?: string
}

export class PostholfDocumentDto {
  @ApiProperty({
    enum: ['pdf'],
    description: 'Always "pdf" — DoE notices are rendered documents.',
  })
  type!: 'pdf'

  @ApiProperty({
    description: 'Base64-encoded PDF. Empty string when includeDocument=false.',
  })
  content!: string

  @ApiProperty({ type: [PostholfDocumentActionDto] })
  actions!: PostholfDocumentActionDto[]
}
