import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Application, ApplicationEvent } from '@dmr.is/shared/dto'

import { Inject, Injectable } from '@nestjs/common'

import { AuthService } from '../auth/auth.service'
import { IApplicationService } from './application.service.interface'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly authService: AuthService,
  ) {
    this.logger.info('Using ApplicationService')
  }
  async getApplication(id: string) {
    this.logger.info('getAdvert', { id })

    const idsToken = await this.authService.getAccessToken()
    if (!idsToken) {
      this.logger.error('Could not get access token from auth service')
      return null
    }

    const xroadClient = process.env.XROAD_DMR_CLIENT
    if (!xroadClient) {
      this.logger.error('Missing required environment')
      return null
    }

    const res = await fetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
      {
        method: 'GET',
        headers: {
          'X-Road-Client': xroadClient,
          Authorization: `Bearer ${idsToken.access_token}`,
        },
      },
    )

    if (res.status !== 200) {
      this.logger.error('Could not get application from xroad', {
        status: res.status,
      })
      return null
    }

    const application: Application = await res.json()

    return application
  }
  async updateApplication(
    id: string,
    event: ApplicationEvent,
    answers = {},
  ): Promise<void> {
    this.logger.info('updateApplication', { id, event })

    const idsToken = await this.authService.getAccessToken()
    if (!idsToken) {
      this.logger.error('Could not get access token from auth service')
      return
    }

    const xroadClient = process.env.XROAD_DMR_CLIENT
    if (!xroadClient) {
      this.logger.error('Missing required environment')
      return
    }

    const res = await fetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
      {
        method: 'POST',
        headers: {
          'X-Road-Client': xroadClient,
          Authorization: `Bearer ${idsToken.access_token}`,
        },
        body: JSON.stringify({
          id: id,
          event: event,
          answers: answers,
        }),
      },
    )

    if (res.status !== 200) {
      this.logger.error('Could not update application in xroad', {
        status: res.status,
      })
    } else {
      this.logger.info('Application updated', { id, event })
    }
  }
}
