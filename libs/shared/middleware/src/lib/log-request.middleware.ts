import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { logger } from '@dmr.is/logging'

@Injectable()
export class LogRequestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query, params } = req
    logger.info(`${method}: ${originalUrl}`, {
      body,
      query,
      params,
    })

    next()
  }
}

export const logRequestMiddlewareFactory = () => {
  return new LogRequestMiddleware()
}
