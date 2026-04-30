import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyService } from '../../../modules/company/company.service.interface'
import { CompanyDto } from '../../../modules/company/dto/company.dto'

export type CompanyResourceRequest = {
  user?: DMRUser
  companyContext?: CompanyDto
}

const LOGGING_CONTEXT = 'CompanyResourceGuard'

@Injectable()
export class CompanyResourceGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CompanyResourceRequest>()
    const user = request.user

    if (!user?.nationalId) {
      this.logger.error('Current user does not have a national ID', {
        context: LOGGING_CONTEXT,
      })
      throw new UnauthorizedException()
    }

    request.companyContext = await this.companyService.getByNationalId(
      user.nationalId,
    )

    return true
  }
}
