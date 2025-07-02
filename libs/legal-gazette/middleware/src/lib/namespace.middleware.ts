import { NextFunction, Request, Response } from 'express'

import { Inject, Injectable, NestMiddleware } from '@nestjs/common'

import { LEGAL_GAZETTE_NAMESPACE } from '@dmr.is/legal-gazette/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

@Injectable()
export class LegalGazetteNamespaceMiddleware implements NestMiddleware {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.debug('Applying namespace header', {
      context: 'NamespaceMiddleware',
    })

    req.headers['x-namespace'] = LEGAL_GAZETTE_NAMESPACE
    next()
  }
}
