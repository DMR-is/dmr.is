import { NextFunction, Request, Response } from 'express'

import { Inject, Injectable, NestMiddleware } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

@Injectable()
export class LogRequestMiddleware implements NestMiddleware {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}
  use(req: Request, res: Response, next: NextFunction) {
    const now = new Date()
    const { protocol, method, originalUrl } = req
    const fullUrl = `${originalUrl}`

    this.logger.info(`[${method}]: ${fullUrl}`, {
      context: 'LoggingMiddleware',
      request: {
        method,
        protocol,
        url: fullUrl,
        body: req.body,
        params: req.params,
        query: req.query,
        timestamp: now.toISOString(),
      },
      response: {
        statusCode: res.statusCode,
      },
    })

    next()
  }
}
