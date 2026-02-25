import { Type } from 'class-transformer'
import { IsOptional, ValidateNested } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

type ClassConstructor<T = unknown> = new (...args: unknown[]) => T

export function ApiOptionalDto<T>(
  classRef: ClassConstructor<T>,
  options?: ApiPropertyOptions,
) {
  return applyDecorators(
    ApiProperty({
      ...options,
      type: classRef,
      required: false,
    }),
    IsOptional(),
    Type(() => classRef),
    ValidateNested(),
  )
}
