import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

import {
  CompanyDto,
} from '@dmr.is/doe-modules'
import { getLogger } from '@dmr.is/logging'

import { CompanyResourceRequest } from '../guards/company-resource/company-resource.guard'

export const CurrentCompany = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CompanyDto => {
    void data

    const request = ctx.switchToHttp().getRequest<CompanyResourceRequest>()
    const logger = getLogger('CurrentCompanyDecorator')

    if (!request?.companyContext) {
      logger.error('Company context was not resolved on request')
      throw new UnauthorizedException()
    }

    return request.companyContext
  },
)
