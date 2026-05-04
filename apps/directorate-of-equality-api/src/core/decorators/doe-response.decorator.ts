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
  /**
   * Content type the success response produces (e.g. `text/html`,
   * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
   *
   * Use this instead of `@ApiProduces` on file/html endpoints. `@ApiProduces`
   * is operation-wide and would mis-tag the JSON `ApiErrorDto` error responses
   * with the same MIME type; setting `content` on the success response only
   * keeps errors as `application/json`.
   */
  produces?: string
}

function buildSuccessContentSchema(produces: string) {
  return produces.startsWith('text/')
    ? { type: 'string' as const }
    : { type: 'string' as const, format: 'binary' }
}

export function DoeResponse({
  operationId,
  status = 200,
  type,
  description,
  successDescription,
  produces,
}: DoeResponseParams) {
  let successDecorator: ReturnType<typeof ApiResponse>

  if (produces) {
    successDecorator = ApiResponse({
      status,
      description: successDescription,
      content: {
        [produces]: { schema: buildSuccessContentSchema(produces) },
      },
    })
  } else if (type || successDescription) {
    successDecorator = ApiResponse({ status, type, description: successDescription })
  } else {
    successDecorator = ApiNoContentResponse()
  }

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
