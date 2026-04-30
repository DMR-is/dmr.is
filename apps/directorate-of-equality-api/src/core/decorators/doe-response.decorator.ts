import { applyDecorators } from '@nestjs/common'
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'

import { ApiErrorDto } from '@dmr.is/shared-dto'

type DoeResponseParams = {
  operationId: string
  description?: string
  status?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type?: any
  successDescription?: string
}

export function DoeResponse({
  operationId,
  status = 200,
  type,
  description,
  successDescription,
}: DoeResponseParams) {
  const successDecorator =
    type || successDescription
      ? ApiResponse({ status, type, description: successDescription })
      : ApiNoContentResponse()

  return applyDecorators(
    ApiOperation({ operationId, description }),
    successDecorator,
    ApiResponse({ status: 400, type: ApiErrorDto }),
    ApiResponse({ status: 401, type: ApiErrorDto }),
    ApiResponse({ status: 403, type: ApiErrorDto }),
    ApiResponse({ status: 404, type: ApiErrorDto }),
    ApiResponse({ status: 500, type: ApiErrorDto }),
  )
}
