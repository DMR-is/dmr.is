import * as z from 'zod'

import { ArgumentsHost, ExceptionFilter } from '@nestjs/common'

import { ApiErrorDto, ApiErrorName } from '@dmr.is/legal-gazette/dto'
import { logger } from '@dmr.is/logging'

const LOGGING_CONTEXT = 'GlobalExceptionFilter'

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
