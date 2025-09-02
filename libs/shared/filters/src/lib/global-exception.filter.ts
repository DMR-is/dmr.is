import { z } from 'zod'

import { ArgumentsHost, ExceptionFilter } from '@nestjs/common'

import { ApiErrorDto, ApiErrorName } from '@dmr.is/legal-gazette/dto'
import { logger } from '@dmr.is/logging'

const LOGGING_CONTEXT = 'GlobalExceptionFilter'

export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    let status = 500

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
    }

    if (exception instanceof TypeError) {
      const culprit = exception.stack?.split('at self.')[1].split('(')[0].trim()

      if (culprit) {
        logger.debug(`READ UNDEFINED PROPERTY = "${culprit}"`, {
          context: LOGGING_CONTEXT,
        })
      }

      return response.status(status).json(err)
    }

    if (exception instanceof Error) {
      const cleanedMessage = exception.message.replace(/\\n/g, '\n')

      logger.error(`An unknown error occurred`, {
        context: LOGGING_CONTEXT,
        message: cleanedMessage,
        error: exception,
      })

      return response.status(status).json(err)
    }

    logger.error(`An unknown non-error was thrown`, {
      context: LOGGING_CONTEXT,
      message: JSON.stringify(exception),
    })

    return response.status(status).json(err)
  }
}
