import { ApiOptionalDateTime, ApiOptionalString } from '@dmr.is/decorators'

export class UpdateSignatureDto {
  @ApiOptionalDateTime({ nullable: true })
  date?: Date | null

  @ApiOptionalString({ nullable: true })
  name?: string | null
  @ApiOptionalString({ nullable: true })
  location?: string | null
  @ApiOptionalString({ nullable: true })
  onBehalfOf?: string | null
}

export class CreateSignatureDto extends UpdateSignatureDto {}
