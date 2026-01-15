import {
  BaseError,
  ConnectionAcquireTimeoutError,
  ForeignKeyConstraintError,
  TimeoutError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize'

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'

import { ApiErrorDto, ApiErrorName } from '@dmr.is/legal-gazette/dto'
import { getLogger } from '@dmr.is/logging'

export const LOGGING_CONTEXT = 'SequelizeExceptionFilter'

@Catch(BaseError)
export class SequelizeExceptionFilter implements ExceptionFilter {
  catch(exception: BaseError, host: ArgumentsHost) {
    const logger = getLogger(LOGGING_CONTEXT)

    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const now = new Date().toISOString()

    const err: ApiErrorDto = {
      statusCode: 500,
      timestamp: now,
    }

    err.name = ApiErrorName.UnknownError
    err.message = 'An unexpected error occurred.'

    if (exception instanceof ConnectionAcquireTimeoutError) {
      err.name = ApiErrorName.ConnectionAcquireTimeoutError
      err.statusCode = 504
    }

    if (exception instanceof ValidationError) {
      err.name = ApiErrorName.ValidationError
      err.statusCode = 400
    }

    if (exception instanceof UniqueConstraintError) {
      err.name = ApiErrorName.UniqueConstraintError
      err.statusCode = 400
    }

    if (exception instanceof ForeignKeyConstraintError) {
      err.name = ApiErrorName.ForeignKeyConstraintError
      err.statusCode = 400
    }

    if (exception instanceof TimeoutError) {
      err.name = ApiErrorName.TimeoutError
      err.statusCode = 504
    }

    logger.error(`${exception.name}, ${exception.message}`, {
      ...exception,
    })

    response.status(err.statusCode).json(err)
  }
}
