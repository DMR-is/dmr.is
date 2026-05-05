import { Transform } from 'class-transformer'
import { IsString, Matches } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiNationalId(options: ApiPropertyOptions = {}) {
  return applyDecorators(
    ApiProperty({
      type: String,
      pattern: '^\\d{6}[- ]?\\d{4}$',
      example: '0101901234',
      description:
        'National ID. Accepts XXXXXXXXXX, XXXXXX-XXXX, or XXXXXX XXXX — always normalised to XXXXXXXXXX.',
      ...options,
    }),
    Transform(({ value }) =>
      typeof value === 'string' ? value.replace(/[- ]/g, '') : value,
    ),
    IsString(),
    Matches(/^\d{10}$/, {
      message:
        'nationalId must be 10 digits (accepted formats: XXXXXXXXXX, XXXXXX-XXXX, XXXXXX XXXX)',
    }),
  )
}
