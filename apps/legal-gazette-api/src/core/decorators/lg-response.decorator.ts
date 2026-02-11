import { applyDecorators } from '@nestjs/common'
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'

import { ApiErrorDto } from '@dmr.is/shared/dto'

type LGResponseParams = {
  operationId: string
  description?: string
  status?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type?: any
}

export function LGResponse({
  operationId,
  status = 200,
  type,
  description,
}: LGResponseParams) {
  return applyDecorators(
    ApiOperation({ operationId, description }),
    type ? ApiResponse({ status, type }) : ApiNoContentResponse(),
    ApiResponse({ status: 400, type: ApiErrorDto }),
    ApiResponse({ status: 401, type: ApiErrorDto }),
    ApiResponse({ status: 403, type: ApiErrorDto }),
    ApiResponse({ status: 404, type: ApiErrorDto }),
    ApiResponse({ status: 500, type: ApiErrorDto }),
  )
}
