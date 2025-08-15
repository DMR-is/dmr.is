import { ApiProperty } from '@nestjs/swagger'

export class UpdateCommonApplicationDto {
  @ApiProperty({ type: String, required: false, nullable: true })
  caption?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  signatureName?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  signatureLocation?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  html?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  categoryId?: string | null
}
