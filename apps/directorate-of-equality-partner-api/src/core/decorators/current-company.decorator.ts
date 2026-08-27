import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

import { CompanyDto } from '@dmr.is/doe-modules/company'

/**
 * The company the verified key belongs to, as resolved by
 * `PartnerCompanyGuard`. Throws rather than returning undefined so a handler
 * cannot silently operate without a tenant.
 */
export const CurrentCompany = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CompanyDto => {
    const company = ctx.switchToHttp().getRequest()?.companyContext

    if (!company) {
      throw new UnauthorizedException()
    }

    return company
  },
)
