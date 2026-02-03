import { Request, Response } from 'express'

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common'

import { AdvertTypeError } from '@dmr.is/ojoi/modules'

@Catch(HttpException)
export class OJOIExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()

    if (exception instanceof AdvertTypeError) {
      return response.status(status).json({
        status: status,
        name: exception.name,
        message: exception.message,
        severity: exception.severity,
      })
    }

    return response.status(status).json({
      status: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
