import { Inject, Injectable } from '@nestjs/common'

import { LogAndHandle } from '@dmr.is/decorators'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CreateRegulationCancelBody,
  CreateRegulationChangeBody,
  RegulationDraft,
  RegulationImpact,
  UpdateRegulationCancelBody,
  UpdateRegulationChangeBody,
  UpdateRegulationDraftBody,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { IAuthService } from '../auth/auth.service.interface'
import { IRegulationsAdminService } from './regulations-admin.service.interface'

const LOGGING_CATEGORY = 'RegulationsAdminService'

/**
 * The regulations-admin API returns impacts as a record keyed by regulation name,
 * e.g. { "0665/2020": [{ id, type, date, ... }] }
 * We flatten this into a RegulationImpact[] with the regulation name on each entry.
 */
function flattenImpacts(
  rawImpacts:
    | Record<
        string,
        Array<{
          id: string
          type: string
          date: string
          title?: string
          text?: string
          appendixes?: string[]
          comments?: string
          diff?: string
          dropped?: boolean
        }>
      >
    | undefined
    | null,
): RegulationImpact[] {
  if (!rawImpacts || typeof rawImpacts !== 'object') return []

  const results: RegulationImpact[] = []
  for (const [regulation, entries] of Object.entries(rawImpacts)) {
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      results.push({
        ...entry,
        regulation,
      })
    }
  }
  return results
}

const getBaseUrl = () =>
  process.env.REGULATIONS_ADMIN_API_URL
    ? `${process.env.REGULATIONS_ADMIN_API_URL}/api`
    : `${process.env.XROAD_ISLAND_IS_PATH}/regulations`

@Injectable()
export class RegulationsAdminService implements IRegulationsAdminService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAuthService) private readonly authService: IAuthService,
  ) {
    this.logger.info('Using RegulationsAdminService')
  }

  private async makeAuthenticatedRequest(
    url: string,
    method: string,
    body?: unknown,
  ): Promise<ResultWrapper<Response>> {
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      this.logger.warn(
        'REGULATIONS_ADMIN_API_URL is not configured, skipping request',
        { category: LOGGING_CATEGORY },
      )
      return ResultWrapper.err({
        code: 503,
        message: 'Regulations admin API is not configured',
      })
    }

    let res: Response
    try {
      res = await this.authService.xroadFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
    } catch (error) {
      this.logger.warn(`Regulations-admin API unreachable: ${method} ${url}`, {
        category: LOGGING_CATEGORY,
        error: error instanceof Error ? error.message : String(error),
      })
      return ResultWrapper.err({
        code: 503,
        message: `Regulations-admin API unreachable: ${method} ${url}`,
      })
    }

    if (!res.ok) {
      this.logger.error(
        `Regulations-admin API request failed: ${method} ${url}`,
        {
          category: LOGGING_CATEGORY,
          statusCode: res.status,
        },
      )
      return ResultWrapper.err({
        code: res.status,
        message: `Regulations-admin API request failed: ${method} ${url}`,
      })
    }

    return ResultWrapper.ok(res)
  }

  @LogAndHandle()
  async getDraft(draftId: string): Promise<ResultWrapper<RegulationDraft>> {
    const url = `${getBaseUrl()}/draft_regulation/${draftId}`

    const result = await this.makeAuthenticatedRequest(url, 'GET')
    if (!result.result.ok) {
      return ResultWrapper.err(result.result.error)
    }

    const raw = await result.result.value.json()

    const draft: RegulationDraft = {
      ...raw,
      impacts: flattenImpacts(raw.impacts),
      authors: Array.isArray(raw.authors)
        ? raw.authors.map((a: string | { authorId?: string }) =>
            typeof a === 'string' ? a : (a.authorId ?? ''),
          )
        : undefined,
    }

    return ResultWrapper.ok(draft)
  }

  @LogAndHandle()
  async updateDraft(
    draftId: string,
    body: UpdateRegulationDraftBody,
  ): Promise<ResultWrapper> {
    const url = `${getBaseUrl()}/draft_regulation/${draftId}`
    const result = await this.makeAuthenticatedRequest(url, 'PUT', body)
    if (!result.result.ok) {
      return ResultWrapper.err(result.result.error)
    }
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async deleteDraft(draftId: string): Promise<ResultWrapper> {
    const url = `${getBaseUrl()}/draft_regulation/${draftId}`
    const result = await this.makeAuthenticatedRequest(url, 'DELETE')
    if (!result.result.ok) {
      return ResultWrapper.err(result.result.error)
    }
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async createChange(
    body: CreateRegulationChangeBody & { changingId: string },
  ): Promise<ResultWrapper> {
    const url = `${getBaseUrl()}/draft_regulation_change`
    const result = await this.makeAuthenticatedRequest(url, 'POST', body)
    if (!result.result.ok) {
      return ResultWrapper.err(result.result.error)
    }
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateChange(
    changeId: string,
    body: UpdateRegulationChangeBody,
  ): Promise<ResultWrapper> {
    const url = `${getBaseUrl()}/draft_regulation_change/${changeId}`
    const result = await this.makeAuthenticatedRequest(url, 'PUT', body)
    if (!result.result.ok) {
      return ResultWrapper.err(result.result.error)
    }
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async deleteChange(changeId: string): Promise<ResultWrapper> {
    const url = `${getBaseUrl()}/draft_regulation_change/${changeId}`
    const result = await this.makeAuthenticatedRequest(url, 'DELETE')
    if (!result.result.ok) {
      return ResultWrapper.err(result.result.error)
    }
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async createCancel(
    body: CreateRegulationCancelBody & { changingId: string },
  ): Promise<ResultWrapper> {
    const url = `${getBaseUrl()}/draft_regulation_cancel`
    const result = await this.makeAuthenticatedRequest(url, 'POST', body)
    if (!result.result.ok) {
      return ResultWrapper.err(result.result.error)
    }
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateCancel(
    cancelId: string,
    body: UpdateRegulationCancelBody,
  ): Promise<ResultWrapper> {
    const url = `${getBaseUrl()}/draft_regulation_cancel/${cancelId}`
    const result = await this.makeAuthenticatedRequest(url, 'PUT', body)
    if (!result.result.ok) {
      return ResultWrapper.err(result.result.error)
    }
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async deleteCancel(cancelId: string): Promise<ResultWrapper> {
    const url = `${getBaseUrl()}/draft_regulation_cancel/${cancelId}`
    const result = await this.makeAuthenticatedRequest(url, 'DELETE')
    if (!result.result.ok) {
      return ResultWrapper.err(result.result.error)
    }
    return ResultWrapper.ok()
  }
}
