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
  type WithholdingTaxErrorReason,
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

/** Upstream error bodies are logged up to this many characters. */
const UPSTREAM_BODY_LOG_LIMIT = 500

/**
 * Structured fields on every log line, so Datadog can facet on them. Never a
 * credential, a token or a company value. Do not add a `message` key: it
 * replaces the log line's own message.
 */
interface LogMeta {
  operation: WithholdingTaxOperation
  /** Host only, never the full URL — tells test traffic from production. */
  host?: string
  incomeYear?: number
  status?: number
  durationMs?: number
  attempt?: number
  [key: string]: unknown
}

interface Sent {
  response: Response
  durationMs: number
}

/**
 * Talks to Skatturinn's WithholdingTaxApi.
 *
 * Logs every call with its duration, and every failure with enough to trace it
 * without a debugger: the reason, the HTTP status, Skatturinn's own error text
 * (credentials and tokens scrubbed out), and a network error's code. Never logs
 * a credential, a token or a successful response body, which is company data.
 */
@Injectable()
export class WithholdingTaxService implements IWithholdingTaxService {
  private readonly tokenCache = new WithholdingTaxTokenCache()

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async checkConnection(): Promise<void> {
    const config = this.requireConfig('token')
    await this.tokenCache.refreshNow(() => this.login(config))
  }

  /**
   * Not cached: every call downloads the year's whole 25+ list from Skatturinn
   * (~20 s). The data changes at most yearly, so once something real consumes
   * it, cache it per income year. doe has no Redis/CacheModule, so either an
   * in-memory per-year cache here (single-flight like the token cache; one copy
   * per instance, lost on restart) or set up a shared cache first.
   */
  async getJobCounts(
    incomeYear: number,
  ): Promise<WithholdingTaxJobCountResult> {
    if (!Number.isInteger(incomeYear) || incomeYear < 1900) {
      throw new RangeError(`Invalid income year: ${incomeYear}`)
    }
    const config = this.requireConfig('getJobCount', { incomeYear })
    const url = `${config.baseUrl}/GetJobCount/${incomeYear}`
    const base: LogMeta = {
      operation: 'getJobCount',
      host: hostOf(config.baseUrl),
      incomeYear,
    }
    const started = Date.now()

    let token = await this.tokenCache.get(() => this.login(config))
    let attempt = 1
    let sent = await this.send(url, base, attempt, {
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: WITHHOLDING_TAX_JOB_COUNT_TIMEOUT_MS,
    })

    // A GET is safe to repeat: a token Skatturinn expired early earns one
    // re-login and one retry.
    if (sent.response.status === 401) {
      this.logger.warn(
        'Skatturinn refused the cached token, logging in again',
        {
          context: LOGGING_CONTEXT,
          ...base,
          status: 401,
          attempt,
        },
      )
      this.tokenCache.invalidate(token)
      token = await this.tokenCache.get(() => this.login(config))
      attempt = 2
      sent = await this.send(url, base, attempt, {
        headers: { Authorization: `Bearer ${token}` },
        timeoutMs: WITHHOLDING_TAX_JOB_COUNT_TIMEOUT_MS,
      })
      if (sent.response.status === 401) {
        throw this.fail(
          'AUTH_FAILED',
          'GetJobCount refused a fresh token',
          await this.withUpstreamBody(sent, config, token, {
            ...base,
            attempt,
          }),
        )
      }
    }
    if (!sent.response.ok) {
      throw this.fail(
        'HTTP_ERROR',
        `GetJobCount returned HTTP ${sent.response.status}`,
        await this.withUpstreamBody(sent, config, token, { ...base, attempt }),
      )
    }

    const raw = await this.readJson(sent, { ...base, attempt })
    // The live API wraps the rows as `{ result: [...] }`; the PDF shows a bare
    // array. Accept both.
    const body =
      raw !== null && typeof raw === 'object' && 'result' in raw
        ? (raw as { result: unknown }).result
        : raw
    if (!Array.isArray(body)) {
      throw this.fail(
        'INVALID_RESPONSE',
        'GetJobCount did not return an array',
        {
          ...base,
          status: sent.response.status,
          bodyShape: shapeOf(raw),
          resultShape: body === raw ? undefined : shapeOf(body),
        },
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
      ...base,
      status: sent.response.status,
      attempt,
      totalDurationMs: Date.now() - started,
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
    const base: LogMeta = { operation: 'token', host: hostOf(config.baseUrl) }
    const sent = await this.send(`${config.baseUrl}/token`, base, 1, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
      timeoutMs: WITHHOLDING_TAX_TOKEN_TIMEOUT_MS,
    })
    const { status } = sent.response

    // Skatturinn answers with 400 and a plain-text "Ekki tókst að auðkenna
    // notanda" both for wrong credentials AND for a caller whose IP is not on
    // its allowlist — the two cannot be told apart from here. Check the
    // egress IP (office, or the environment's NAT gateway) before the
    // password. The body is logged to tell either from a malformed request.
    if (status === 400 || status === 401 || status === 403) {
      throw this.fail(
        'AUTH_FAILED',
        `Token request rejected with HTTP ${status}`,
        await this.withUpstreamBody(sent, config, null, base),
      )
    }
    if (!sent.response.ok) {
      throw this.fail(
        'HTTP_ERROR',
        `Token request returned HTTP ${status}`,
        await this.withUpstreamBody(sent, config, null, base),
      )
    }

    const body = await this.readJson(sent, base)
    const parsed = tokenResponseSchema.safeParse(body)
    if (!parsed.success) {
      throw this.fail(
        'INVALID_RESPONSE',
        'Token response has no access_token',
        {
          ...base,
          status,
          bodyShape: shapeOf(body),
        },
      )
    }

    this.logger.info('Skatturinn token obtained', {
      context: LOGGING_CONTEXT,
      ...base,
      status,
      durationMs: sent.durationMs,
      expiresInSeconds: parsed.data.expires_in ?? null,
    })
    return {
      value: parsed.data.access_token,
      expiresAt: tokenExpiresAt(parsed.data.expires_in, Date.now()),
    }
  }

  private async send(
    url: string,
    base: LogMeta,
    attempt: number,
    init: RequestInit & { timeoutMs: number },
  ): Promise<Sent> {
    const { timeoutMs, ...rest } = init
    const started = Date.now()
    try {
      const response = await fetch(url, {
        ...rest,
        signal: AbortSignal.timeout(timeoutMs),
      })
      const durationMs = Date.now() - started
      this.logger.debug(`Skatturinn ${base.operation} responded`, {
        context: LOGGING_CONTEXT,
        ...base,
        status: response.status,
        durationMs,
        attempt,
      })
      return { response, durationMs }
    } catch (error) {
      const durationMs = Date.now() - started
      const timedOut =
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      throw this.fail(
        timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        timedOut
          ? `${base.operation} timed out after ${timeoutMs} ms`
          : `${base.operation} could not reach Skatturinn`,
        {
          ...base,
          attempt,
          durationMs,
          timeoutMs,
          ...networkCause(error),
        },
      )
    }
  }

  private async readJson(sent: Sent, base: LogMeta): Promise<unknown> {
    const contentType = sent.response.headers.get('content-type')
    try {
      return await sent.response.json()
    } catch {
      throw this.fail(
        'INVALID_RESPONSE',
        `${base.operation} returned a body that is not JSON`,
        { ...base, status: sent.response.status, contentType },
      )
    }
  }

  /**
   * Adds Skatturinn's error body to a failure's log fields: truncated, with
   * the username, password and token replaced. Error bodies are short messages
   * and the logger masks kennitölur besides, so this carries no company data.
   */
  private async withUpstreamBody(
    sent: Sent,
    config: WithholdingTaxConfig,
    token: string | null,
    base: LogMeta,
  ): Promise<LogMeta> {
    let upstreamBody: string | null = null
    try {
      const text = await sent.response.text()
      const secrets = [config.password, config.username, token]
      upstreamBody =
        secrets
          .filter((s): s is string => Boolean(s))
          .reduce((acc, secret) => acc.split(secret).join('[REDACTED]'), text)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, UPSTREAM_BODY_LOG_LIMIT) || null
    } catch {
      // An unreadable body is not worth masking the original failure.
    }
    return {
      ...base,
      status: sent.response.status,
      durationMs: sent.durationMs,
      contentType: sent.response.headers.get('content-type'),
      upstreamBody,
    }
  }

  private requireConfig(
    operation: WithholdingTaxOperation,
    extra: Partial<LogMeta> = {},
  ): WithholdingTaxConfig {
    const result = readWithholdingTaxConfig()
    if (!result.ok) {
      throw this.fail(
        'NOT_CONFIGURED',
        `Skatturinn is not configured: ${result.missing.join(', ')} unset`,
        { ...extra, operation, missing: result.missing },
      )
    }
    return result.config
  }

  private fail(
    reason: WithholdingTaxErrorReason,
    message: string,
    meta: LogMeta,
  ): WithholdingTaxError {
    this.logger.error(message, { context: LOGGING_CONTEXT, reason, ...meta })
    return new WithholdingTaxError(reason, meta.operation, message, meta.status)
  }
}

function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host
  } catch {
    return 'invalid-url'
  }
}

/** Type and top-level keys of an unexpected body — never its values. */
function shapeOf(body: unknown): string {
  if (body === null) return 'null'
  if (Array.isArray(body)) return `array(${body.length})`
  if (typeof body === 'object') {
    return `object{${Object.keys(body).slice(0, 20).join(',')}}`
  }
  return typeof body
}

/**
 * Node's fetch throws `TypeError('fetch failed')` and keeps the real reason
 * (`ENOTFOUND`, `ECONNRESET`, `CERT_HAS_EXPIRED`, …) on `cause`.
 */
function networkCause(error: unknown): Record<string, string> {
  if (!(error instanceof Error)) return { errorType: typeof error }
  // The lib target predates ES2022's `Error.cause`, so read it structurally.
  const cause = (error as { cause?: { code?: unknown; message?: unknown } })
    .cause
  return {
    errorName: error.name,
    errorMessage: error.message,
    ...(typeof cause?.code === 'string' && { causeCode: cause.code }),
    ...(typeof cause?.message === 'string' && { causeMessage: cause.message }),
  }
}
