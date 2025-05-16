import { NextFunction, Request, Response } from 'express'

import { NestMiddleware } from '@nestjs/common'

import { LEGAL_GAZETTE_NAMESPACE } from '@dmr.is/legal-gazette/constants'

export class LegalGazetteNamespaceMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    req.headers['x-namespace'] = LEGAL_GAZETTE_NAMESPACE
    next()
  }
}
