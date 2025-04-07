import { ApiErrorDto, ApiErrorName } from '@dmr.is/legal-gazette/dto'
import { logger } from '@dmr.is/logging'

import { ArgumentsHost, ExceptionFilter } from '@nestjs/common'

const LOGGING_CONTEXT = 'GlobalExceptionFilter'

export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = 500

    const now = new Date().toISOString()

    const err: ApiErrorDto = {
      statusCode: status,
      timestamp: now,
      name: ApiErrorName.UnknownError,
    }

    logger.error(`An unknown error occurred`, {
      context: LOGGING_CONTEXT,
      exception:
        exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    })

    response.status(status).json(err)
  }
}
