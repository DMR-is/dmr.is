import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Application,
  ApplicationEvent,
  SubmitApplicationBody,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'

import { Inject, Injectable } from '@nestjs/common'

import { AuthService } from '../auth/auth.service'
import { IApplicationService } from './application.service.interface'

const LOGGING_CATEGORY = 'application-service'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly authService: AuthService,
  ) {
    this.logger.info('Using ApplicationService')
  }

  private xroadFetch = async (url: string, options: RequestInit) => {
    const idsToken = await this.authService.getAccessToken()

    if (!idsToken) {
      this.logger.error('Could not get access token from auth service', {
        category: LOGGING_CATEGORY,
      })
      throw new Error('Could not get access token from auth service')
    }

    const xroadClient = process.env.XROAD_DMR_CLIENT
    if (!xroadClient) {
      this.logger.error('Missing required environment')
      throw new Error('Missing required environment')
    }

    this.logger.info(`${options.method}: ${url}`, {
      category: LOGGING_CATEGORY,
      url: url,
    })

    const requestOption = {
      ...options,
      headers: {
        ...options.headers,
        'X-Road-Client': xroadClient,
      },
    }

    return await fetch(url, {
      ...requestOption,
      headers: {
        ...requestOption.headers,
        Authorization: `Bearer ${idsToken.access_token}`,
      },
    })
  }

  async getApplication(id: string) {
    this.logger.info('getAdvert', { id, category: LOGGING_CATEGORY })

    try {
      const res = await this.xroadFetch(
        `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
        {
          method: 'GET',
        },
      )

      if (res.status !== 200) {
        this.logger.error('Could not get application from xroad', {
          status: res.status,
          category: LOGGING_CATEGORY,
        })
        return null
      }

      const application: Application = await res.json()

      return application
    } catch (error) {
      this.logger.error('Exception occured, could not get application', {
        error,
        category: LOGGING_CATEGORY,
      })
      return null
    }
  }

  async submitApplication(id: string, body: SubmitApplicationBody) {
    this.logger.info('submitApplication', {
      id,
      body,
      category: LOGGING_CATEGORY,
    })

    try {
      const res = await this.xroadFetch(
        `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}/submit`,
        {
          method: 'PUT',
          body: new URLSearchParams({
            event: 'REJECT',
          }),
        },
      )

      if (res.status !== 200) {
        this.logger.error('Could not submit application', {
          status: res.status,
          category: LOGGING_CATEGORY,
        })
        return null
      }

      const application: Application = await res.json()

      return application
    } catch (error) {
      this.logger.error('Exception occured, could not submit application', {
        error,
        category: LOGGING_CATEGORY,
      })
      return null
    }
  }

  async updateApplication(id: string, answers: UpdateApplicationBody) {
    this.logger.info('updateApplication', {
      id,
      answers: { ...answers },
      category: LOGGING_CATEGORY,
    })

    try {
      const res = await this.xroadFetch(
        `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
        {
          method: 'POST',
          body: new URLSearchParams({
            id: id,
            answers: JSON.stringify(answers),
          }),
        },
      )

      if (res.status !== 200) {
        this.logger.error('Could not update application', {
          status: res.status,
          category: LOGGING_CATEGORY,
        })
        return null
      } else {
        this.logger.info('Application updated', {
          id,
          category: LOGGING_CATEGORY,
        })
        return await res.json()
      }
    } catch (error) {
      this.logger.error('Exception occured, could not update application', {
        error,
        category: LOGGING_CATEGORY,
      })
      return null
    }
  }
}
