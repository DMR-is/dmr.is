import { NextFunction,Request, Response } from 'express'
import { logger } from '@dmr.is/logging'

import { Injectable, NestMiddleware } from '@nestjs/common'

@Injectable()
export class LogRequestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, url } = req

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
