import { Type } from 'class-transformer'
import { IsArray, IsDefined, ValidateNested } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

type ClassConstructor<T = unknown> = new (...args: unknown[]) => T

export function ApiDtoArray<T>(
  classRef: ClassConstructor<T>,
  options?: ApiPropertyOptions,
) {
  return applyDecorators(
    ApiProperty(
      {
        type: classRef,
        isArray: true,
        ...options,
      } as ApiPropertyOptions,
    ),
    IsDefined(),
    IsArray(),
    Type(() => classRef),
    ValidateNested({ each: true }),
  )
}
