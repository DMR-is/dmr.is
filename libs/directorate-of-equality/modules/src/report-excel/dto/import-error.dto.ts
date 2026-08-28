import {
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

export class ImportErrorDto {
  @ApiString()
  sheet!: string

  @ApiOptionalNumber({ nullable: true })
  row!: number | null

  @ApiOptionalString({ nullable: true })
  column!: string | null

  @ApiString()
  message!: string
}
