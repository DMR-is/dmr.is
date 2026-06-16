import {
  BadGatewayException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  ApplicationSystemEvent,
  IApplicationSystemService,
} from './application-system.service.interface'

const LOGGING_CONTEXT = 'ApplicationSystemService'
const LOGGING_CATEGORY = 'application-system-service'

// Refresh slightly before the token actually expires so we never send a
// request with a token that lapses mid-flight.
const TOKEN_EXPIRY_BUFFER_MS = 5_000

interface IdsToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

/**
 * Owns all outbound communication between the DoE API and the island.is
 * application system. Folds the IDS `client_credentials` token management and
 * the authenticated fetch helper (kept as separate concerns in official-journal)
 * into a single service, since this module is the only one responsible for
 * talking to the application system.
 *
 * Outbound only — inbound notifications (e.g. an applicant deleting an
 * application → report WITHDRAWN) are handled locally in the `application`
 * module and do not flow through here.
 *
 * Reuses the shared OJ/DMR env vars:
 *   ISLAND_IS_TOKEN_URL, ISLAND_IS_DMR_CLIENT_ID, ISLAND_IS_DMR_CLIENT_SECRET,
 *   ISLAND_IS_DMR_CLIENT_SCOPES, XROAD_DMR_CLIENT, XROAD_ISLAND_IS_PATH.
 */
@Injectable()
export class ApplicationSystemService implements IApplicationSystemService {
  private idsToken: IdsToken | null = null
  private tokenExpiresAt: number | null = null

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async notifyApproved(applicationId: string): Promise<void> {
    await this.submitEvent(applicationId, ApplicationSystemEvent.APPROVE)
  }

  async notifyDenied(applicationId: string): Promise<void> {
    await this.submitEvent(applicationId, ApplicationSystemEvent.DENY)
  }

  async notifyEdited(applicationId: string): Promise<void> {
    await this.submitEvent(applicationId, ApplicationSystemEvent.EDIT)
  }

  /**
   * Drives the island.is application state machine by submitting an event:
   * `PUT .../application-callback-v2/applications/{id}/submit` with the event
   * as a form-urlencoded body.
   */
  private async submitEvent(
    applicationId: string,
    event: ApplicationSystemEvent,
  ): Promise<void> {
    const res = await this.authenticatedFetch(
      this.applicationCallbackUrl(applicationId, 'submit'),
      {
        method: 'PUT',
        body: new URLSearchParams({ event }),
      },
    )

    if (!res.ok) {
      this.logger.error('Failed to submit event to application system', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        applicationId,
        event,
        statusCode: res.status,
      })
      throw new InternalServerErrorException(
        `Failed to submit event "${event}"`,
      )
    }
  }

  private applicationCallbackUrl(applicationId: string, path = ''): string {
    const base = `${this.requireEnv('XROAD_ISLAND_IS_PATH')}/application-callback-v2/applications/${applicationId}`
    return path ? `${base}/${path}` : base
  }

  private async authenticatedFetch(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    const token = await this.getAccessToken()
    const xroadClient = this.requireEnv('XROAD_DMR_CLIENT')

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
        'X-Road-Client': xroadClient,
      },
    }).catch((err) => {
      this.logger.error('Failed to reach application system', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        url,
        message: err instanceof Error ? err.message : String(err),
      })
      throw err
    })
  }

  private async getAccessToken(): Promise<IdsToken> {
    if (!this.idsToken || this.isTokenExpired()) {
      await this.refresh()
    }

    if (!this.idsToken) {
      this.logger.error(
        'No access token available after refresh — cannot authenticate request',
        {
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
        },
      )
      throw new BadGatewayException(
        'Could not obtain access token from identity server',
      )
    }

    return this.idsToken
  }

  private isTokenExpired(): boolean {
    return (
      !this.tokenExpiresAt ||
      this.tokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS < Date.now()
    )
  }

  private async refresh(): Promise<void> {
    const body = new URLSearchParams({
      client_id: this.requireEnv('ISLAND_IS_DMR_CLIENT_ID'),
      client_secret: this.requireEnv('ISLAND_IS_DMR_CLIENT_SECRET'),
      grant_type: 'client_credentials',
      scope: this.requireEnv('ISLAND_IS_DMR_CLIENT_SCOPES'),
    })

    this.logger.info('Fetching access token from ids', {
      category: LOGGING_CATEGORY,
    })

    let res: Response
    try {
      res = await fetch(this.requireEnv('ISLAND_IS_TOKEN_URL'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
    } catch (error) {
      this.logger.error('Failed to reach identity server', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        message: error instanceof Error ? error.message : String(error),
      })
      throw new BadGatewayException('Failed to reach identity server')
    }

    if (!res.ok) {
      this.logger.error('Failed to fetch access token from ids', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        status: res.status,
      })
      throw new BadGatewayException('Failed to fetch access token from ids')
    }

    const token: IdsToken = await res.json()
    this.idsToken = token
    this.tokenExpiresAt = Date.now() + token.expires_in * 1_000
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
