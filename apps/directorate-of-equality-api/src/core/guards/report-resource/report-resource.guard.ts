import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { IAuthorizationService } from '../../../modules/authorization/authorization.service.interface'

@Injectable()
export class ReportResourceGuard implements CanActivate {
  constructor(
    @Inject(IAuthorizationService)
    private readonly authorizationService: IAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user as DMRUser
    const reportId = request.params.reportId as string

    request.reportResourceContext =
      await this.authorizationService.resolveReportResourceContext(
        reportId,
        user.nationalId,
      )

    return true
  }
}
