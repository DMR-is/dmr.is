import { applyDecorators } from '@nestjs/common'
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'

import { ApiErrorDto } from '@dmr.is/shared-dto'

const DEFAULT_ERRORS = [400, 401, 403, 500]

type DoeResponseParams = {
  operationId: string
  description?: string
  status?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type?: any
  successDescription?: string
  errors?: number[]
  include404?: boolean
}

export function DoeResponse({
  operationId,
  status = 200,
  type,
  description,
  successDescription,
  errors = DEFAULT_ERRORS,
  include404 = false,
}: DoeResponseParams) {
  const successDecorator =
    type || successDescription
      ? ApiResponse({ status, type, description: successDescription })
      : ApiNoContentResponse()

  const effectiveErrors = include404 ? [...errors, 404] : errors

  return applyDecorators(
    ApiOperation({ operationId, description }),
    successDecorator,
    ...effectiveErrors.map((code) => ApiResponse({ status: code, type: ApiErrorDto })),
  )
}
