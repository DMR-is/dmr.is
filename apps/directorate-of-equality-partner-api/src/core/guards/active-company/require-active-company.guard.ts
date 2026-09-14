import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { CompanyStatusEnum } from '@dmr.is/doe-modules/company'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { PartnerCompanyRequest } from '../partner-company/partner-company.guard'
import { ACTIVE_COMPANY_METADATA } from './require-active-company.decorator'

const LOGGING_CONTEXT = 'RequireActiveCompanyGuard'

/**
 * Refuses any call made for a company that is not ACTIVE in the register.
 *
 * Must run after `PartnerCompanyGuard`, which resolves the company the key
 * belongs to. Running without it is a wiring mistake, not an authorization
 * failure, so it says so in the log and answers a bare 500 — the same split as
 * `RequireApiScopeGuard`, and for the same reason: a 409 here would send an
 * integrator chasing a company registration that is fine.
 *
 * Declared on the controller, so this covers reads as well as submissions.
 *
 * **409, not 403.** The company's registration can change — it flips back to
 * ACTIVE when it reappears in the annual import, or when an admin says so — so
 * this is a state conflict rather than a permanent refusal, and it sits beside
 * the renewal-window 409 that `submitSalary` already answers with. A 403 would
 * also be indistinguishable from the scope refusal one guard earlier.
 *
 * ⚠️ **The message is the entire diagnosis.** `PartnerCompanyDto` deliberately
 * does not carry the register status — it is the Directorate's own bookkeeping
 * and there is nothing a vendor can do with it — so a caller cannot read the
 * flag and work out why it was refused. That makes this string the only thing
 * standing between an integrator and an unexplained failure, and it has to name
 * the cause and who can fix it. It names no internal identifier.
 */
@Injectable()
export class RequireActiveCompanyGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(
      ACTIVE_COMPANY_METADATA,
      [context.getHandler(), context.getClass()],
    )

    if (!required) {
      return true
    }

    const request = context.switchToHttp().getRequest<PartnerCompanyRequest>()

    if (!request.companyContext) {
      this.logger.error(
        'RequireActiveCompanyGuard ran without PartnerCompanyGuard — fix the @UseGuards order',
        { context: LOGGING_CONTEXT },
      )
      throw new InternalServerErrorException()
    }

    if (request.companyContext.status !== CompanyStatusEnum.ACTIVE) {
      // Logged with the company so an operator fielding the vendor's support
      // call can find it; the response names no identifier.
      this.logger.info('Refused a call made for an inactive company', {
        context: LOGGING_CONTEXT,
        companyId: request.companyContext.id,
      })

      throw new ConflictException(
        'The company is not active in the register held by Jafnréttisstofa and cannot use this API. The company must contact Jafnréttisstofa to have its registration reinstated.',
      )
    }

    return true
  }
}
