import { Type } from 'class-transformer'
import { IsDefined, ValidateNested } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

type ClassConstructor<T = unknown> = new (...args: unknown[]) => T

export function ApiDto<T>(
  classRef: ClassConstructor<T>,
  options?: ApiPropertyOptions,
) {
  return applyDecorators(
    ApiProperty({
      type: classRef,
      ...options,
    }),
    IsDefined(),
    Type(() => classRef),
    ValidateNested(),
  )
}
