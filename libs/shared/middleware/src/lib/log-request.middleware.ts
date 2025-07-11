import { NextFunction, Request, Response } from 'express'

import { Inject, Injectable, NestMiddleware } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

@Injectable()
export class LogRequestMiddleware implements NestMiddleware {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}
  use(req: Request, res: Response, next: NextFunction) {
    const now = new Date()
    const { protocol, method, originalUrl } = req
    const host = req.get('host')
    const fullUrl = `${protocol}://${host}${originalUrl}`

    this.logger.info(`${method} request: ${fullUrl}`, {
      request: {
        method,
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
