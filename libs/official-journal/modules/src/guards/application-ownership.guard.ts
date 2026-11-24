import { isUUID } from 'class-validator'

import {
  BadGatewayException,
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IApplicationService } from '../application/application.service.interface'
import { isApplicationParty } from '../auth/application-party'

const LOGGING_CATEGORY = 'application-ownership-guard'
const LOGGING_CONTEXT = 'ApplicationOwnershipGuard'

/**
 * Lets a request through only when the caller is a party to the application
 * named by `:id`: the applicant or an assignee (see `isApplicationParty`).
 * Runs after the guards that authenticate the caller; the caller's national
 * id is the token subject, which those guards leave on `req.user.nationalId`.
 *
 * A malformed id is a 400. A caller who is not a party gets the same 404 as a
 * missing application, so the route does not confirm which ids exist. Any
 * other failure to fetch the application is a 502. The fetched application is
 * left on `req.application`; handlers read it with `CurrentApplication`.
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

    // Guards run before route pipes, so the id is validated here.
    if (!applicationId || !isUUID(applicationId)) {
      throw new BadRequestException(
        `Parameter <${applicationId}> is not a valid UUID`,
      )
    }

    const lookup = await this.applicationService.getApplication(applicationId)

    if (!lookup.result.ok) {
      const { code } = lookup.result.error
      this.logger.warn('Could not fetch application', {
        applicationId,
        error: lookup.result.error,
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })

      // Only a miss is "not found"; any other failure is the application
      // system being unavailable, not a statement about the caller.
      if (code === 404) {
        throw new NotFoundException('Application not found')
      }
      throw new BadGatewayException('Application system is unavailable')
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
