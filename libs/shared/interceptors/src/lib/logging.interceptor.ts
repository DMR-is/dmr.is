import { logger } from '@dmr.is/logging'
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'

import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

const LOGGING_CONTEXT = 'LoggingInterceptor'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now()

    const controller = context.getClass().name
    const method = context.getHandler().name

    logger.info(`Executing ${controller}.${method}`, {
      context: LOGGING_CONTEXT,
    })

    return next.handle().pipe(
      tap(() => {
        const end = Date.now()
        const duration = end - startTime

        if (duration < 1000) {
          logger.info(`${controller}.${method} executed in ${duration}ms`, {
            context: LOGGING_CONTEXT,
          })
        }

        if (duration >= 1000 && duration < 2000) {
          logger.warn(`${controller}.${method} executed in ${duration}ms`, {
            context: LOGGING_CONTEXT,
          })
        }

        if (duration >= 2000) {
          logger.error(`${controller}.${method} executed in ${duration}ms`, {
            context: LOGGING_CONTEXT,
          })
        }

        return
      }),
    )
  }
}
