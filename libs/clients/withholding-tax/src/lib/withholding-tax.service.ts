import { Inject, Injectable } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  readWithholdingTaxConfig,
  WITHHOLDING_TAX_JOB_COUNT_TIMEOUT_MS,
  WITHHOLDING_TAX_TOKEN_TIMEOUT_MS,
  type WithholdingTaxConfig,
} from './withholding-tax.config'
import {
  WithholdingTaxError,
  type WithholdingTaxOperation,
} from './withholding-tax.errors'
import {
  jobCountRowSchema,
  toJobCount,
  tokenResponseSchema,
  type WithholdingTaxJobCount,
} from './withholding-tax.schemas'
import type {
  IWithholdingTaxService,
  WithholdingTaxJobCountResult,
} from './withholding-tax.service.interface'
import {
  tokenExpiresAt,
  type WithholdingTaxToken,
  WithholdingTaxTokenCache,
} from './withholding-tax-token'

const LOGGING_CONTEXT = 'WithholdingTaxService'

/**
 * Talks to Skatturinn's WithholdingTaxApi. Never logs a credential, a token
 * or a response body.
 */
@Injectable()
export class WithholdingTaxService implements IWithholdingTaxService {
  private readonly tokenCache = new WithholdingTaxTokenCache()

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async checkConnection(): Promise<void> {
    const config = this.requireConfig('token')
    await this.tokenCache.refreshNow(() => this.login(config))
  }

  async getJobCounts(
    incomeYear: number,
  ): Promise<WithholdingTaxJobCountResult> {
    if (!Number.isInteger(incomeYear) || incomeYear < 1900) {
      throw new RangeError(`Invalid income year: ${incomeYear}`)
    }
    const config = this.requireConfig('getJobCount')
    const url = `${config.baseUrl}/GetJobCount/${incomeYear}`

    let token = await this.tokenCache.get(() => this.login(config))
    let response = await this.send('getJobCount', url, {
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: WITHHOLDING_TAX_JOB_COUNT_TIMEOUT_MS,
    })

    // A GET is safe to repeat: a token Skatturinn expired early earns one
    // re-login and one retry.
    if (response.status === 401) {
      this.tokenCache.invalidate(token)
      token = await this.tokenCache.get(() => this.login(config))
      response = await this.send('getJobCount', url, {
        headers: { Authorization: `Bearer ${token}` },
        timeoutMs: WITHHOLDING_TAX_JOB_COUNT_TIMEOUT_MS,
      })
      if (response.status === 401) {
        throw this.fail(
          'AUTH_FAILED',
          'getJobCount',
          'GetJobCount refused a fresh token',
          401,
        )
      }
    }
    if (!response.ok) {
      throw this.fail(
        'HTTP_ERROR',
        'getJobCount',
        `GetJobCount returned HTTP ${response.status}`,
        response.status,
      )
    }

    const body = await this.readJson('getJobCount', response)
    if (!Array.isArray(body)) {
      throw this.fail(
        'INVALID_RESPONSE',
        'getJobCount',
        'GetJobCount did not return an array',
      )
    }

    const companies: WithholdingTaxJobCount[] = []
    const skipped: WithholdingTaxJobCountResult['skipped'] = []
    body.forEach((row, index) => {
      const parsed = jobCountRowSchema.safeParse(row)
      if (parsed.success) {
        companies.push(toJobCount(parsed.data))
      } else {
        // Paths and codes only: the values are company data.
        skipped.push({
          index,
          issues: parsed.error.issues.map(
            (issue) => `${issue.path.join('.') || '(row)'}: ${issue.code}`,
          ),
        })
      }
    })

    const meta = {
      context: LOGGING_CONTEXT,
      incomeYear,
      received: body.length,
      accepted: companies.length,
      skipped: skipped.length,
    }
    if (skipped.length > 0) {
      this.logger.warn('GetJobCount returned rows that failed validation', {
        ...meta,
        firstSkipped: skipped.slice(0, 5),
      })
    } else {
      this.logger.info('GetJobCount succeeded', meta)
    }

    return { incomeYear, companies, skipped }
  }

  private async login(
    config: WithholdingTaxConfig,
  ): Promise<WithholdingTaxToken> {
    const response = await this.send('token', `${config.baseUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
      timeoutMs: WITHHOLDING_TAX_TOKEN_TIMEOUT_MS,
    })
    if (
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403
    ) {
      throw this.fail(
        'AUTH_FAILED',
        'token',
        `Token request rejected with HTTP ${response.status}`,
        response.status,
      )
    }
    if (!response.ok) {
      throw this.fail(
        'HTTP_ERROR',
        'token',
        `Token request returned HTTP ${response.status}`,
        response.status,
      )
    }
    const parsed = tokenResponseSchema.safeParse(
      await this.readJson('token', response),
    )
    if (!parsed.success) {
      throw this.fail(
        'INVALID_RESPONSE',
        'token',
        'Token response has no access_token',
      )
    }
    return {
      value: parsed.data.access_token,
      expiresAt: tokenExpiresAt(parsed.data.expires_in, Date.now()),
    }
  }

  private async send(
    operation: WithholdingTaxOperation,
    url: string,
    init: RequestInit & { timeoutMs: number },
  ): Promise<Response> {
    const { timeoutMs, ...rest } = init
    try {
      return await fetch(url, {
        ...rest,
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      const timedOut =
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      throw this.fail(
        timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        operation,
        timedOut
          ? `${operation} timed out after ${timeoutMs} ms`
          : `${operation} could not reach Skatturinn`,
      )
    }
  }

  private async readJson(
    operation: WithholdingTaxOperation,
    response: Response,
  ): Promise<unknown> {
    try {
      return await response.json()
    } catch {
      throw this.fail(
        'INVALID_RESPONSE',
        operation,
        `${operation} returned a body that is not JSON`,
      )
    }
  }

  private requireConfig(
    operation: WithholdingTaxOperation,
  ): WithholdingTaxConfig {
    const config = readWithholdingTaxConfig()
    if (!config) {
      throw this.fail(
        'NOT_CONFIGURED',
        operation,
        'RSK_WITHHOLDING_TAX_API_PATH, _USERNAME and _PASSWORD must all be set',
      )
    }
    return config
  }

  private fail(
    reason: WithholdingTaxError['reason'],
    operation: WithholdingTaxOperation,
    message: string,
    status?: number,
  ): WithholdingTaxError {
    const error = new WithholdingTaxError(reason, operation, message, status)
    this.logger.error(message, {
      context: LOGGING_CONTEXT,
      reason,
      operation,
      status,
    })
    return error
  }
}
