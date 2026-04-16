import { Inject, Injectable } from '@nestjs/common'

import { LogAndHandle } from '@dmr.is/decorators'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Advert, RegulationDraft } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { IRegulationPublishService } from './regulation-publish.service.interface'
import { convertDraftToPublishPayload } from './regulation-publish.utils'

const LOGGING_CATEGORY = 'RegulationPublishService'

@Injectable()
export class RegulationPublishService implements IRegulationPublishService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {
    this.logger.info('Using RegulationPublishService')
  }

  private getBaseUrl(): string {
    return process.env.REGULATIONS_API_URL ?? ''
  }

  private getAuthHeader(): string {
    const username = process.env.REGULATIONS_API_USERNAME ?? ''
    const password = process.env.REGULATIONS_API_PASSWORD ?? ''
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  }

  @LogAndHandle()
  async publishRegulationDirectly(
    draft: RegulationDraft,
    publishedDate: Date,
    advert: Advert,
  ): Promise<ResultWrapper> {
    const baseUrl = this.getBaseUrl()
    if (!baseUrl) {
      this.logger.warn('REGULATIONS_API_URL is not configured', {
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 503,
        message: 'Regulations API is not configured',
      })
    }

    const payload = convertDraftToPublishPayload(draft, publishedDate)

    // Use the advert's publication number as the regulation name if the draft has none
    if (!payload.name && advert.publicationNumber) {
      payload.name = `${String(advert.publicationNumber.number).padStart(4, '0')}/${advert.publicationNumber.year}`
    }

    let res: Response
    try {
      res = await fetch(`${baseUrl}/api/v1/regulation/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      this.logger.error('Failed to reach regulations-api for publish', {
        category: LOGGING_CATEGORY,
        error: error instanceof Error ? error.message : String(error),
      })
      return ResultWrapper.err({
        code: 503,
        message: 'Regulations API unreachable',
      })
    }

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '')
      this.logger.error('Regulations-api publish failed', {
        category: LOGGING_CATEGORY,
        statusCode: res.status,
        errorBody,
      })
      return ResultWrapper.err({
        code: res.status,
        message: `Regulation publish failed: ${res.status}`,
      })
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async hasPendingTasks(
    baseRegulationName: string,
  ): Promise<ResultWrapper<boolean>> {
    const baseUrl = this.getBaseUrl()
    if (!baseUrl) {
      this.logger.warn('REGULATIONS_API_URL is not configured', {
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 503,
        message: 'Regulations API is not configured',
      })
    }

    const encodedName = encodeURIComponent(baseRegulationName)

    let res: Response
    try {
      res = await fetch(
        `${baseUrl}/api/v1/regulation/${encodedName}/pending-tasks`,
        {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
          },
        },
      )
    } catch (error) {
      this.logger.error('Failed to reach regulations-api for pending tasks', {
        category: LOGGING_CATEGORY,
        error: error instanceof Error ? error.message : String(error),
      })
      return ResultWrapper.err({
        code: 503,
        message: 'Regulations API unreachable',
      })
    }

    if (!res.ok) {
      this.logger.error('Regulations-api pending-tasks check failed', {
        category: LOGGING_CATEGORY,
        statusCode: res.status,
      })
      return ResultWrapper.err({
        code: res.status,
        message: `Pending tasks check failed: ${res.status}`,
      })
    }

    const body = await res.json() as { hasPendingTasks: boolean }
    return ResultWrapper.ok(body.hasPendingTasks)
  }
}
