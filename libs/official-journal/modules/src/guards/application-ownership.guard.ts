import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IApplicationService } from '../application/application.service.interface'
import { isApplicationParty } from '../application/lib/application-party'

const LOGGING_CATEGORY = 'application-ownership-guard'
const LOGGING_CONTEXT = 'ApplicationOwnershipGuard'

/**
 * Lets a request through only when the caller is a party to the application
 * named by `:id`: the applicant or an assignee (see `isApplicationParty`).
 * Runs after the guards that authenticate the caller; the caller's national
 * id is the token subject, which those guards leave on `req.user.nationalId`.
 *
 * A caller who is not a party gets the same 404 as a missing application, so
 * the route does not confirm which ids exist. The fetched application is left
 * on `req.application`.
 */
@Injectable()
export class ApplicationOwnershipGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const applicationId: string | undefined = req.params?.id

    if (!applicationId) {
      throw new NotFoundException('Application not found')
    }

    let lookup
    try {
      lookup = await this.applicationService.getApplication(applicationId)
    } catch (error) {
      this.logger.warn('Could not fetch application', {
        applicationId,
        error,
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      throw new NotFoundException('Application not found')
    }

    if (!lookup.result.ok) {
      this.logger.warn('Could not fetch application', {
        applicationId,
        error: lookup.result.error,
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      throw new NotFoundException('Application not found')
    }

    const { application } = lookup.result.value

    if (
      !isApplicationParty(application, { nationalId: req.user?.nationalId })
    ) {
      this.logger.warn('Caller is not a party to the application', {
        applicationId,
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      throw new NotFoundException('Application not found')
    }

    req.application = application
    return true
  }
}
