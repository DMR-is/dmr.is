import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyService } from '../../../modules/company/company.service.interface'
import { CompanyDto } from '../../../modules/company/dto/company.dto'
import { AUTO_PROVISION_COMPANY_METADATA } from '../../decorators/auto-provision-company.decorator'

export type CompanyResourceRequest = {
  user?: DMRUser
  companyContext?: CompanyDto
  body?: { company?: { name?: unknown } }
}

const LOGGING_CONTEXT = 'CompanyResourceGuard'

@Injectable()
export class CompanyResourceGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
    private readonly reflector: Reflector,
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

    const autoProvision = this.reflector.getAllAndOverride<boolean>(
      AUTO_PROVISION_COMPANY_METADATA,
      [context.getHandler(), context.getClass()],
    )

    if (autoProvision) {
      const bodyName = request.body?.company?.name
      const fallbackName =
        typeof bodyName === 'string' && bodyName.trim().length > 0
          ? bodyName.trim()
          : undefined

      request.companyContext = await this.companyService.getOrCreateByNationalId(
        user.nationalId,
        fallbackName,
      )
    } else {
      request.companyContext = await this.companyService.getByNationalId(
        user.nationalId,
      )
    }

    return true
  }
}
