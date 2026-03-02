import { Type } from 'class-transformer'
import { IsArray, IsOptional, ValidateNested } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

type ClassConstructor<T = unknown> = new (...args: unknown[]) => T

export function ApiOptionalDtoArray<T>(
  classRef: ClassConstructor<T>,
  options?: ApiPropertyOptions,
) {
  return applyDecorators(
    ApiProperty(
      {
        type: () => classRef,
        isArray: true,
        required: false,
        ...options,
      } as ApiPropertyOptions,
    ),
    IsOptional(),
    IsArray(),
    Type(() => classRef),
    ValidateNested({ each: true }),
  )
}
