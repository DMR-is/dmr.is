import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

import {
  ReportResourceContext,
} from '@dmr.is/doe-modules'
import { getLogger } from '@dmr.is/logging'


export const CurrentReportResourceContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ReportResourceContext => {
    const request = ctx.switchToHttp().getRequest()
    const logger = getLogger('CurrentReportResourceContextDecorator')

    if (!request?.reportResourceContext) {
      logger.error('Report resource context was not resolved on request')
      throw new UnauthorizedException()
    }

    return request.reportResourceContext
  },
)
