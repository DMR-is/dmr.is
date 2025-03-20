import { applyDecorators,Post } from '@nestjs/common'
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiParamOptions,
  ApiResponse,
  ApiResponseMetadata,
  ApiTags,
} from '@nestjs/swagger'

import { LogMethod } from './log-method.decorator'

type PostRouteOptions = {
  path: string
  operationId: string
  body: ApiResponseMetadata['type']
  type?: ApiResponseMetadata['type']
  summary?: string
  description?: string
  bodyRequired?: boolean
  params?: ApiParamOptions[]
  tag?: string
}

export function PostRoute({
  path,
  operationId,
  body,
  summary,
  bodyRequired = true,
  type,
  params = [],
  tag = 'Post',
}: PostRouteOptions) {
  const decorators = [
    ApiTags(tag),
    ApiOperation({
      operationId: operationId,
      summary,
    }),
    ApiBody({
      type: body,
      required: bodyRequired,
    }),
    type
      ? ApiResponse({
          status: 204,
          type,
        })
      : ApiNoContentResponse(),
  ]

  if (params && params.length) {
    params.forEach((param) => {
      decorators.push(ApiParam(param))
    })
  }

  decorators.push(LogMethod())
  decorators.push(Post(path))

  return applyDecorators(...decorators)
}
