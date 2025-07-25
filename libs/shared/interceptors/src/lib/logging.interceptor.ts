import { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { logger } from '@dmr.is/logging'

const LOGGING_CONTEXT = 'LoggingInterceptor'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now()

    const controller = context.getClass().name
    const method = context.getHandler().name

    logger.debug(`Executing ${controller}.${method}`, {
      context: LOGGING_CONTEXT,
    })

    // TODO: Integrate to datadog alert/slack notification if duration is longer than 2 seconds

    return next.handle().pipe(
      tap(() => {
        const end = Date.now()
        const duration = end - startTime

        const message = `${controller}.${method} executed in ${duration}ms`

        const info = {
          context: LOGGING_CONTEXT,
          controller,
          method,
          duration: `${duration}ms`,
        }

        if (duration < 300) {
          logger.info(message, info)
        }

        if (duration >= 300 && duration < 1000) {
          logger.warn(message, info)
        }

        if (duration >= 1000) {
          logger.error(message, info)
        }

        return
      }),
      catchError((error: unknown) => {
        const end = Date.now()
        const duration = end - startTime

        logger.warn(`${controller}.${method} failed after ${duration}ms:`, {
          context: LOGGING_CONTEXT,
          controller,
          method,
          duration: `${duration}ms`,
        })

        throw error
      }),
    )
  }
}
