import * as z from 'zod'

import { ArgumentsHost, ExceptionFilter } from '@nestjs/common'

import { logger } from '@dmr.is/logging'
import { ApiErrorDto, ApiErrorName } from '@dmr.is/shared-dto'

const LOGGING_CONTEXT = 'GlobalExceptionFilter'

/**
 * A client error raised below Nest — body-parser refusing a body that is too
 * large, not JSON, or in an unsupported charset. These are `http-errors`
 * instances: a 4xx `status` with `expose: true`, meaning the message is written
 * for the caller. They are not `HttpException`s, so without this they land here
 * and read as a 500, telling the caller our server failed when its request was
 * refused.
 */
type ExposedClientError = Error & { status: number; expose: true }

const isExposedClientError = (
  exception: unknown,
): exception is ExposedClientError => {
  if (!(exception instanceof Error)) {
    return false
  }

  const { status, expose } = exception as Partial<ExposedClientError>

  return (
    expose === true &&
    typeof status === 'number' &&
    status >= 400 &&
    status < 500
  )
}

const CLIENT_ERROR_NAMES: Partial<Record<number, ApiErrorName>> = {
  400: ApiErrorName.BadRequest,
  413: ApiErrorName.PayloadTooLarge,
}

export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    let status = 500
    try {
      const now = new Date().toISOString()

      const err: ApiErrorDto = {
        statusCode: status,
        timestamp: now,
        name: ApiErrorName.InternalServerError,
      }

      if (exception instanceof z.ZodError) {
        status = 400
        err.name = ApiErrorName.BadRequest
        err.message = 'Invalid form data'

        return response.status(status).json(err)
      }

      if (isExposedClientError(exception)) {
        status = exception.status
        err.statusCode = status
        err.name = CLIENT_ERROR_NAMES[status] ?? ApiErrorName.BadRequest
        err.message = exception.message
        err.details = [exception.message]

        logger.warn(`Client error before routing: ${exception.message}`, {
          context: LOGGING_CONTEXT,
          status,
        })

        return response.status(status).json(err)
      }

      if (exception instanceof Error) {
        const cleanedMessage = exception.message.replace(/\\n/g, '\n')

        logger.error(`Internal server exception: ${cleanedMessage}`, {
          context: LOGGING_CONTEXT,
          detail: cleanedMessage,
          error: exception,
        })

        return response.status(status).json(err)
      }

      logger.error(`An unknown non-error was thrown`, {
        context: LOGGING_CONTEXT,
        detail: JSON.stringify(exception),
      })

      return response.status(status).json(err)
    } catch (err) {
      logger.error(`Error in GlobalExceptionFilter`, {
        context: LOGGING_CONTEXT,
        detail: err,
      })

      return response.status(500).json({
        statusCode: 500,
        timestamp: new Date().toISOString(),
        name: ApiErrorName.InternalServerError,
      })
    }
  }
}
