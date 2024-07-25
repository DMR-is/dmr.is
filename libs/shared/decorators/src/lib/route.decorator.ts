import { Delete, Get, Post, Put, applyDecorators } from '@nestjs/common'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiParamOptions,
  ApiQuery,
  ApiQueryOptions,
  ApiResponse,
  ApiResponseMetadata,
} from '@nestjs/swagger'
import { LogMethod } from './log-method.decorator'

interface BaseRouteOptions {
  method?: 'get' | 'post' | 'put' | 'delete'
  path?: string
  operationId?: string
  bodyType?: ApiResponseMetadata['type']
  responseType?: ApiResponseMetadata['type']
  summary?: string
  description?: string
  params?: ApiParamOptions[]
  query?: ApiQueryOptions[]
  tags?: string[]
}

export function Route({
  method = 'get',
  path,
  operationId,
  bodyType,
  responseType,
  summary,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tags = [],
  params = [],
  query = [],
}: BaseRouteOptions) {
  const decorators = []

  decorators.push(LogMethod())

  // if (tags.length) {
  //   decorators.push(ApiTags(...tags, 'api'))
  // } else {
  //   decorators.push(ApiTags(method, 'default'))
  // }

  if (operationId) {
    decorators.push(
      ApiOperation({
        operationId,
        summary,
      }),
    )
  }

  if (responseType) {
    decorators.push(
      ApiResponse({
        type: responseType,
      }),
    )
  } else {
    switch (method) {
      case 'get':
        decorators.push(ApiOkResponse())
        break
      case 'post':
        decorators.push(ApiCreatedResponse())
        break
      case 'delete':
      case 'put':
        decorators.push(ApiNoContentResponse())
        break
      default:
        decorators.push(ApiOkResponse())
        break
    }
  }

  if (bodyType) {
    decorators.push(ApiBody({ type: bodyType, required: true }))
  }

  if (params && params.length) {
    params.forEach((param) => {
      decorators.push(ApiParam(param))
    })
  }

  if (query && query.length) {
    query.forEach((q) => {
      decorators.push(ApiQuery(q))
    })
  }

  switch (method) {
    case 'get':
      decorators.push(Get(path))
      break
    case 'post':
      decorators.push(Post(path))
      break
    case 'put':
      decorators.push(Put(path))
      break
    case 'delete':
      decorators.push(Delete(path))
      break
  }

  return applyDecorators(...decorators)
}
