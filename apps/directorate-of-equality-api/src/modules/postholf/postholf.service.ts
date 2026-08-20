import {
  BadGatewayException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  NOTICE_SUBJECT,
  POSTHOLF_CATEGORY,
  POSTHOLF_LIMITS,
  POSTHOLF_LOGGING_CATEGORY,
  POSTHOLF_LOGGING_CONTEXT,
  POSTHOLF_MINIMUM_AUTHENTICATION_TYPE,
  POSTHOLF_TYPE,
} from './lib/postholf.constants'
import {
  IPostholfService,
  RegisterNoticeInput,
  RegisterNoticeResult,
} from './postholf.service.interface'

const LOGGING_CONTEXT = POSTHOLF_LOGGING_CONTEXT
const LOGGING_CATEGORY = POSTHOLF_LOGGING_CATEGORY

// Refresh slightly before the token actually expires so we never send a request
// with a token that lapses mid-flight.
const TOKEN_EXPIRY_BUFFER_MS = 5_000

/**
 * One item of a Pósthólf batch response. Every mutating endpoint answers with an
 * array of these, and `success` is per item — a `200` on the request as a whole
 * says nothing about whether the document was accepted.
 */
type PostholfItemResponse = {
  kennitala?: string
  documentId?: string
  wantsPaper?: boolean
  success?: boolean
  errors?: string[]
}

type EntraToken = {
  access_token: string
  token_type: string
  expires_in: number
}

/**
 * Owns all outbound communication between the DoE API and the island.is mailbox
 * (Pósthólf), via its Skjalatilkynning API. Mirrors
 * `modules/application-system/application-system.service.ts`: token management
 * and the authenticated fetch folded into the one service responsible for
 * talking to this system.
 *
 * Two deliberate differences from that file, both consequences of Pósthólf not
 * being an island.is IDS service:
 *
 *  - The token comes from **Microsoft Entra** (`POSTHOLF_TOKEN_URL`), with the
 *    scope `{POSTHOLF_BASE_PATH}/.default`, not from island.is IDS.
 *  - There is **no `X-Road-Client` header** — Skjalatilkynning is called
 *    directly. (Only the inbound Skjalaveita callback goes over X-Road.)
 *
 * Every registration is one item, not a batch. Pósthólf accepts up to 200 per
 * request, but a batch response reports success per item while our idempotency
 * contract records one `company_event` per company — one item per call keeps
 * those aligned without bookkeeping. Volumes here are a handful per day.
 *
 * Env (all read lazily inside methods, never at module scope):
 *   POSTHOLF_ENABLED, POSTHOLF_BASE_PATH, POSTHOLF_TOKEN_URL,
 *   POSTHOLF_CLIENT_ID, POSTHOLF_CLIENT_SECRET, POSTHOLF_SCOPE,
 *   POSTHOLF_SENDER_NATIONAL_ID, POSTHOLF_SENDER_NAME
 */
@Injectable()
export class PostholfService implements IPostholfService {
  private token: EntraToken | null = null
  private tokenExpiresAt: number | null = null

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  /**
   * Master switch. Off by default so a deploy can never start serving legal
   * notices before someone deliberately turns it on; also drives the count-only
   * dry run in the reminder task.
   */
  static isEnabled(): boolean {
    return process.env.POSTHOLF_ENABLED === 'true'
  }

  async wantsPaper(nationalId: string): Promise<boolean> {
    const res = await this.authenticatedFetch(
      `${this.baseUrl()}/api/v1/${nationalId}/paper`,
      { method: 'GET' },
    )

    if (!res.ok) {
      // Not fatal on its own, but we must not guess: assuming "no paper" here
      // would electronically serve a recipient who has opted out.
      this.logger.error('Failed to read paper preference from Pósthólf', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        statusCode: res.status,
      })
      throw new BadGatewayException('Failed to read paper preference')
    }

    const body = (await res.json()) as { wantsPaper?: boolean }
    return body.wantsPaper === true
  }

  async registerNotice(
    input: RegisterNoticeInput,
  ): Promise<RegisterNoticeResult> {
    const subjectBuilder = NOTICE_SUBJECT[input.tier]
    if (!subjectBuilder) {
      throw new InternalServerErrorException(
        `No mailbox subject defined for tier ${input.tier}`,
      )
    }

    const subject = subjectBuilder(input.reportType)

    this.assertWithinLimit(
      'documentId',
      input.documentId,
      POSTHOLF_LIMITS.documentId,
    )
    this.assertWithinLimit('subject', subject, POSTHOLF_LIMITS.subject)
    this.assertWithinLimit(
      'category',
      POSTHOLF_CATEGORY,
      POSTHOLF_LIMITS.category,
    )
    this.assertWithinLimit('type', POSTHOLF_TYPE, POSTHOLF_LIMITS.type)

    const senderKennitala = this.requireEnv('POSTHOLF_SENDER_NATIONAL_ID')

    return this.postBatchItem(
      `${this.baseUrl()}/api/v1/documentindexes`,
      {
        kennitala: input.nationalId,
        documentId: input.documentId,
        senderKennitala,
        senderName: this.requireEnv('POSTHOLF_SENDER_NAME'),
        authorKennitala: senderKennitala,
        category: POSTHOLF_CATEGORY,
        type: POSTHOLF_TYPE,
        subject,
        documentDate: input.documentDate.toISOString(),
        minimumAuthenticationType: POSTHOLF_MINIMUM_AUTHENTICATION_TYPE,
        fileType: 'pdf',
      },
      { documentId: input.documentId, tier: input.tier },
    )
  }

  async withdrawNotice(
    nationalId: string,
    documentId: string,
    reason: string,
  ): Promise<RegisterNoticeResult> {
    return this.postBatchItem(
      `${this.baseUrl()}/api/v1/documentindexes/withdraw`,
      { kennitala: nationalId, documentId, reason },
      { documentId },
    )
  }

  async getCategories(): Promise<string[]> {
    return this.getVocabulary('categories')
  }

  async getTypes(): Promise<string[]> {
    return this.getVocabulary('types')
  }

  private async getVocabulary(kind: 'categories' | 'types'): Promise<string[]> {
    const res = await this.authenticatedFetch(
      `${this.baseUrl()}/api/v1/documentindexes/${kind}`,
      { method: 'GET' },
    )

    if (!res.ok) {
      throw new BadGatewayException(`Failed to read Pósthólf ${kind}`)
    }

    return (await res.json()) as string[]
  }

  /**
   * Posts a single-item batch and flattens the per-item response.
   *
   * Pósthólf returns `200` with `[{ success: false, errors: [...] }]` for a
   * rejected item, so `res.ok` alone would report a delivery that never
   * happened. An empty array is treated as failure for the same reason — silence
   * is not acceptance.
   */
  private async postBatchItem(
    url: string,
    item: Record<string, unknown>,
    logContext: Record<string, unknown> = {},
  ): Promise<RegisterNoticeResult> {
    const res = await this.authenticatedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([item]),
    })

    if (!res.ok) {
      this.logger.error('Pósthólf rejected the request', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        url,
        statusCode: res.status,
        ...logContext,
      })
      return {
        success: false,
        errors: [`Pósthólf responded ${res.status}`],
        wantsPaper: false,
      }
    }

    const body = (await res.json()) as PostholfItemResponse[] | null
    const first = Array.isArray(body) ? body[0] : undefined

    if (!first) {
      this.logger.error('Pósthólf returned an empty batch response', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        url,
        ...logContext,
      })
      return {
        success: false,
        errors: ['Pósthólf returned an empty response'],
        wantsPaper: false,
      }
    }

    const result: RegisterNoticeResult = {
      success: first.success === true,
      errors: first.errors ?? [],
      wantsPaper: first.wantsPaper === true,
    }

    if (!result.success) {
      this.logger.error('Pósthólf did not accept the document', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        url,
        errors: result.errors,
        ...logContext,
      })
    }

    return result
  }

  private baseUrl(): string {
    return this.requireEnv('POSTHOLF_BASE_PATH').replace(/\/+$/, '')
  }

  private assertWithinLimit(field: string, value: string, limit: number): void {
    if (value.length > limit) {
      // Better to fail here than to have Pósthólf reject the item and leave the
      // reminder task retrying a payload that can never be accepted.
      throw new InternalServerErrorException(
        `Pósthólf field "${field}" is ${value.length} characters, limit is ${limit}`,
      )
    }
  }

  private async authenticatedFetch(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    const token = await this.getAccessToken()

    this.logger.info(`${options.method}: ${url}`, {
      category: LOGGING_CATEGORY,
      context: LOGGING_CONTEXT,
      url,
    })

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token.access_token}`,
      },
    }).catch((err) => {
      this.logger.error('Failed to reach Pósthólf', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        url,
        message: err instanceof Error ? err.message : String(err),
      })
      throw err
    })
  }

  private async getAccessToken(): Promise<EntraToken> {
    if (!this.token || this.isTokenExpired()) {
      await this.refresh()
    }

    if (!this.token) {
      this.logger.error(
        'No access token available after refresh — cannot authenticate request',
        { category: LOGGING_CATEGORY, context: LOGGING_CONTEXT },
      )
      throw new BadGatewayException(
        'Could not obtain access token for Pósthólf',
      )
    }

    return this.token
  }

  private isTokenExpired(): boolean {
    return (
      !this.tokenExpiresAt ||
      this.tokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS < Date.now()
    )
  }

  /**
   * Client-credentials against Microsoft Entra. `POSTHOLF_SCOPE` defaults to
   * `{POSTHOLF_BASE_PATH}/.default`, which is the shape island.is's own mailbox
   * client uses, but stays overridable because the value arrives with the
   * credentials and we have not seen it yet.
   */
  private async refresh(): Promise<void> {
    const scope = process.env.POSTHOLF_SCOPE || `${this.baseUrl()}/.default`

    const body = new URLSearchParams({
      client_id: this.requireEnv('POSTHOLF_CLIENT_ID'),
      client_secret: this.requireEnv('POSTHOLF_CLIENT_SECRET'),
      grant_type: 'client_credentials',
      scope,
    })

    this.logger.info('Fetching access token for Pósthólf', {
      category: LOGGING_CATEGORY,
      context: LOGGING_CONTEXT,
    })

    let res: Response
    try {
      res = await fetch(this.requireEnv('POSTHOLF_TOKEN_URL'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
    } catch (error) {
      this.logger.error('Failed to reach the Pósthólf token endpoint', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        message: error instanceof Error ? error.message : String(error),
      })
      throw new BadGatewayException(
        'Failed to reach the Pósthólf token endpoint',
      )
    }

    if (!res.ok) {
      this.logger.error('Failed to fetch access token for Pósthólf', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        status: res.status,
      })
      throw new BadGatewayException('Failed to fetch access token for Pósthólf')
    }

    const token = (await res.json()) as EntraToken
    this.token = token
    this.tokenExpiresAt = Date.now() + token.expires_in * 1_000

    this.logger.info('Successfully fetched access token for Pósthólf', {
      category: LOGGING_CATEGORY,
      context: LOGGING_CONTEXT,
      expiresIn: token.expires_in,
    })
  }

  private requireEnv(name: string): string {
    const value = process.env[name]
    if (!value) {
      this.logger.error(`Missing required environment variable: ${name}`, {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      throw new InternalServerErrorException(
        `Missing required environment variable: ${name}`,
      )
    }
    return value
  }
}
