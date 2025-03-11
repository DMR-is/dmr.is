import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { logger } from '@dmr.is/logging'

@Injectable()
export class LogRequestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, url, headers } = req

    console.log('Request headers:', headers)

    logger.debug(`${method}: ${url}`, {
      context: 'LogRequestMiddleware',
      method,
      url,
    })

    next()
  }
}

export const logRequestMiddlewareFactory = () => {
  return new LogRequestMiddleware()
}
