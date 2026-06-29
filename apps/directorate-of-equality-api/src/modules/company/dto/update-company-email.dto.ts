import { IsEmail, IsOptional } from 'class-validator'

import { ApiOptionalString } from '@dmr.is/decorators'

export class UpdateCompanyEmailDto {
  @ApiOptionalString({
    nullable: true,
    description:
      'Contact email for the company. Null (or empty) clears it. Read by the report-deadline-reminder task.',
  })
  // Null/omitted clears the email; any present value must be a valid address.
  @IsOptional()
  @IsEmail()
  email!: string | null
}
