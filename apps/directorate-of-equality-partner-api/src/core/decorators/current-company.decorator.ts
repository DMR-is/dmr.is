import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

import { CompanyDto } from '@dmr.is/doe-modules/company'

/**
 * The company the request acts for, as resolved by
 * `PartnerCompanyGuard` — a company key's own company, or the company a vendor
 * client key named in `X-Company-National-Id` and holds a delegation from. Throws rather than returning undefined so a handler
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
