import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'

import { IAuthorizationService } from '@dmr.is/doe-modules/authorization'
import { ReportRoleEnum } from '@dmr.is/doe-modules/report'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  assertCompanyToken,
  assertStaffToken,
} from '../token-surface/token-surface'

const LOGGING_CONTEXT = 'ReportResourceGuard'

@Injectable()
export class ReportResourceGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAuthorizationService)
    private readonly authorizationService: IAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user as DMRUser
    const reportId = request.params.reportId as string

    const resourceContext =
      await this.authorizationService.resolveReportResourceContext(
        reportId,
        user.nationalId,
      )

    // Which token rule applies depends on who the caller resolved as, so it
    // runs after resolution and before the context is attached.
    if (resourceContext.actor.kind === ReportRoleEnum.REVIEWER) {
      assertStaffToken(user, this.logger, LOGGING_CONTEXT)
    } else {
      assertCompanyToken(user, this.logger, LOGGING_CONTEXT)
    }

    request.reportResourceContext = resourceContext

    return true
  }
}
