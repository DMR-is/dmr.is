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
import { APPLICATION_REQUEST_KEY } from './current-application.decorator'

const RETRYABLE_CODES = [408, 429]
const LOGGING_CATEGORY = 'application-ownership-guard'
const LOGGING_CONTEXT = 'ApplicationOwnershipGuard'

/**
 * Lets a request through only when the caller is a party to the application
 * named by `:id`: the applicant or an assignee (see `isApplicationParty`).
 * Runs after the guards that authenticate the caller; the caller's national
 * id is the token subject, which those guards leave on `req.user.nationalId`.
 *
 * A malformed id is a 400. A caller who is not a party gets the same 404 as a
 * missing application, and so does any 4xx answer for the id, so the route
 * does not distinguish kinds of unavailable ids. Any other failure to fetch the
 * application (5xx, timeout, network) is a logged 502. The fetched application
 * is left on `req.application`; handlers read it with `CurrentApplication`.
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

      // A 4xx says something about this id, and all of them read as "not
      // found". A request that timed out (408) or was throttled (429) says
      // nothing about the id, so those count as the system being unavailable,
      // like 5xx and network errors.
      if (code >= 400 && code < 500 && !RETRYABLE_CODES.includes(code)) {
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

    req[APPLICATION_REQUEST_KEY] = application
    return true
  }
}
