import { Put, applyDecorators } from '@nestjs/common'
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiParamOptions,
  ApiResponseMetadata,
  ApiTags,
} from '@nestjs/swagger'
import { LogMethod } from './log-method.decorator'

type PutRouteOptions = {
  path: string
  operationId: string
  type?: ApiResponseMetadata['type']
  summary?: string
  description?: string
  bodyRequired?: boolean
  params?: ApiParamOptions[]
  tag?: string
}

export function PutRoute({
  path,
  operationId,
  type,
  summary,
  bodyRequired = true,
  params,
  tag = 'Put',
}: PutRouteOptions) {
  const decorators = [
    ApiTags(tag),
    ApiOperation({
      operationId: operationId,
      summary: summary,
    }),
    ApiNoContentResponse(),
  ]

  if (type) {
    decorators.push(ApiBody({ type, required: bodyRequired }))
  }

  if (params && params.length) {
    params.forEach((param) => {
      decorators.push(ApiParam(param))
    })
  }

  decorators.push(LogMethod())
  decorators.push(Put(path))

  return applyDecorators(...decorators)
}
