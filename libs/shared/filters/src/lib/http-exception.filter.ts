import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import { logger } from '@dmr.is/logging'
import { ApiErrorDto, ApiErrorName } from '@dmr.is/shared-dto'

const LOGGING_CONTEXT = 'HttpExceptionFilter'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = exception.getStatus()

    const now = new Date().toISOString()

    const err: ApiErrorDto = {
      statusCode: status,
      timestamp: now,
    }

    const exceptionResponse = exception.getResponse()

    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const details = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message
        : [exceptionResponse.message]

      err.details = details
    }

    // A curated, localized message thrown alongside the error (see
    // error-messages files). Survives the status switch below, which only
    // sets the generic English `message`.
    if (
      typeof exceptionResponse === 'object' &&
      'translatedMessage' in exceptionResponse &&
      typeof exceptionResponse.translatedMessage === 'string'
    ) {
      err.translatedMessage = exceptionResponse.translatedMessage
    }

    logger.warn(`${exception.name} - ${exception.message}`, {
      context: LOGGING_CONTEXT,
      exception,
    })

    switch (exception.constructor) {
      case NotFoundException:
        err.statusCode = 404
        err.name = ApiErrorName.NotFound
        err.message = 'Resource not found.'
        break
      case UnauthorizedException:
        err.statusCode = 401
        err.name = ApiErrorName.Unauthorized
        err.message = 'Unauthorized.'
        break
      case ForbiddenException:
        err.statusCode = 403
        err.name = ApiErrorName.Forbidden
        err.message = 'Forbidden.'
        break
      case BadRequestException:
        err.statusCode = 400
        err.name = ApiErrorName.BadRequest
        err.message = 'Bad request.'

        break
      case InternalServerErrorException:
        err.statusCode = 500
        err.name = ApiErrorName.InternalServerError
        err.message = 'An unexpected error occurred.'
        break
      default:
        // Matched by status rather than class: ThrottlerException lives in
        // @nestjs/throttler, and a subclass of ConflictException would miss a
        // constructor match. Anything unlisted keeps the generic body.
        switch (status) {
          case HttpStatus.CONFLICT:
            err.name = ApiErrorName.Conflict
            err.message = 'Conflict.'
            break
          case HttpStatus.PAYLOAD_TOO_LARGE:
            err.name = ApiErrorName.PayloadTooLarge
            err.message = 'Payload too large.'
            break
          case HttpStatus.TOO_MANY_REQUESTS:
            err.name = ApiErrorName.TooManyRequests
            err.message = 'Too many requests.'
            break
          default:
            err.message = 'An unexpected error occurred.'
        }
    }

    response.status(err.statusCode).json(err)
  }
}
