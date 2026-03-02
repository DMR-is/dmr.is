import { Transform } from 'class-transformer'
import { isBase64, IsString } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiHTML(options: ApiPropertyOptions = {}) {
  return applyDecorators(
    ApiProperty({
      type: String,
      description: 'HTML content encoded as base64',
      ...options,
    }),

    Transform(({ value }) => {
      if (!value) return value

      if (isBase64(value)) {
        try {
          return Buffer.from(value, 'base64').toString('utf-8')
        } catch {
          return value
        }
      }

      return value
    }),
    IsString(),
  )
}
