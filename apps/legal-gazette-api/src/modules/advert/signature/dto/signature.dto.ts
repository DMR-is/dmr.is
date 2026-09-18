import { ApiOptionalDate, ApiOptionalString } from '@dmr.is/decorators'

export class UpdateSignatureDto {
  @ApiOptionalDate({ nullable: true })
  date?: Date | null

  @ApiOptionalString({ nullable: true })
  name?: string | null
  @ApiOptionalString({ nullable: true })
  location?: string | null
  @ApiOptionalString({ nullable: true })
  onBehalfOf?: string | null
}

export class CreateSignatureDto extends UpdateSignatureDto {}
