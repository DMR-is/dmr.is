import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import {
  BaseError,
  TimeoutError,
  ValidationError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
} from 'sequelize'

import { logger } from '@dmr.is/logging'
import { ApiErrorDto, ApiErrorName } from '@dmr.is/legal-gazette/dto'

export const LOGGING_CONTEXT = 'SequelizeExceptionFilter'

@Catch(BaseError)
export class SequelizeExceptionFilter implements ExceptionFilter {
  catch(exception: BaseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const now = new Date().toISOString()

    logger.error(`${exception.name} - ${exception.message}`, {
      context: LOGGING_CONTEXT,
      exception,
    })

    const err: ApiErrorDto = {
      statusCode: 500,
      timestamp: now,
    }

    switch (exception.constructor) {
      case TimeoutError:
        err.statusCode = 504
        err.name = ApiErrorName.TimeoutError
        break

      case ValidationError:
        err.statusCode = 400
        err.name = ApiErrorName.ValidationError
        break

      case ForeignKeyConstraintError:
        err.statusCode = 400
        err.name = ApiErrorName.ForeignKeyConstraintError
        break

      case UniqueConstraintError:
        err.statusCode = 400
        err.name = ApiErrorName.UniqueConstraintError
        break
      default:
        err.message = 'An unexpected error occurred.'
    }

    response.status(err.statusCode).json(err)
  }
}
