/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApplicationEvent } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAuthService } from '@dmr.is/official-journal/modules/auth'
import { ResultWrapper } from '@dmr.is/types'

import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { IApplicationService } from './application.service.interface'

const LOGGING_CATEGORY = 'application-service'
const LOGGING_CONTEXT = 'ApplicationService'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAuthService)
    private readonly authService: IAuthService,
  ) {}

  /**
   * Retrieves an application by id
   * @param id application id
   * @returns
   */
  @LogAndHandle()
  async getApplication(
    id: string,
  ): Promise<ResultWrapper<{ application: any }>> {
    const res = await this.authService.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
      {
        method: 'GET',
      },
    )

    if (!res.ok) {
      this.logger.error(`Could not get application<${id}>`, {
        applicationId: id,
        status: res.status,
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      return ResultWrapper.err({
        code: res.status,
        message: `Application<${id}> not found`,
      })
    }

    const application = await res.json()

    return ResultWrapper.ok({ application })
  }

  /**
   * Updates the state of an application moving it from e.g. draft to submitted
   * @param id application id
   * @param event the event to trigger
   * @returns
   */
  @LogAndHandle()
  async submitApplication(
    id: string,
    event: ApplicationEvent,
  ): Promise<ResultWrapper<{ application: any }>> {
    const res = await this.authService.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}/submit`,
      {
        method: 'PUT',
        body: new URLSearchParams({
          event: event,
        }),
      },
    )

    if (!res.ok) {
      throw new InternalServerErrorException(
        `Could not submit application<${id}>`,
      )
    }

    const application = await res.json()

    return ResultWrapper.ok({ application })
  }

  /**
   * Updates the answers of an application
   * @param id application id
   * @param answers the answers to update
   * @returns
   */
  @LogAndHandle()
  async updateApplication(
    id: string,
    answers: Record<string, any>,
  ): Promise<ResultWrapper<{ application: any }>> {
    const res = await this.authService.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
      },
    )

    if (!res.ok) {
      this.logger.error(`Could not update application<${id}>`, {
        applicationId: id,
        status: res.status,
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })

      throw new HttpException('Could not update application', res.status)
    }

    const application = await res.json()

    return ResultWrapper.ok({ application })
  }
}
