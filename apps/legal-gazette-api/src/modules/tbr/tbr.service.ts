import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { fetchWithTimeout } from '@dmr.is/utils-server/httpUtils'

import {
  TBRGetPaymentQueryDto,
  TBRGetPaymentResponseDto,
  TBRPostPaymentBodyDto,
} from './dto/tbr.dto'
import { ITBRConfig } from './tbr.config'
import { ITBRService } from './tbr.service.interface'

type TBRPaymentJSON = {
  capital: number
  interest: number
  expense: number
  agreement: boolean
  paymentAdjustment: boolean
  agreementReference: { code: string | null; description: string | null }
  liquidity: { code: string | null; description: string | null }
  arrearsReference: {
    code: string | null
    description: string | null
    date: string | null
  }
  canceled: boolean
}

type TBRGetPaymentResponse = {
  result: TBRPaymentJSON
}

type TBRPathString = `/${string}`

const LOGGING_CONTEXT = 'TBRService'

@Injectable()
export class TBRService implements ITBRService {
  private readonly credentials: string
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ITBRConfig) private config: ITBRConfig,
  ) {
    if (!this.config) {
      throw new Error('TBR config not provided')
    }

    if (!this.config.credentials) {
      throw new Error('TBR credentials not provided')
    }

    if (!this.config.tbrBasePath) {
      throw new Error('TBR base path not provided')
    }

    if (!this.config.officeId) {
      throw new Error('TBR officeId not provided')
    }

    if (!process.env.LG_TBR_CHARGE_CATEGORY_PERSON) {
      throw new Error('TBR charge category for person not provided')
    }

    if (!process.env.LG_TBR_CHARGE_CATEGORY_COMPANY) {
      throw new Error('TBR charge category for company not provided')
    }

    if (!process.env.XROAD_DMR_CLIENT) {
      throw new Error('X-Road client not provided')
    }

    this.credentials = btoa(this.config.credentials)
  }

  private async request(
    path: TBRPathString,
    options?: Omit<RequestInit, 'headers'>,
    index?: number,
  ) {
    const endpoint = new URL(`${this.config.tbrBasePath}${path}`).toString()
    try {
      this.logger.info(`Making TBR ${index !== undefined ? `request #${index} to` : 'request to'}:`, {
        message: `/${endpoint.split('/').slice(-2).join('/')}`,
        path: path,
        method: options?.method || 'GET',
        context: LOGGING_CONTEXT,
      })

      const response = await fetchWithTimeout(endpoint, {
        headers: {
          Authorization: `Basic ${this.credentials}`,
          'Content-Type': 'application/json',
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          'X-Road-Client': process.env.XROAD_DMR_CLIENT!,
        },
        ...options,
      })

      if (!response.ok) {
        let err
        let rawBody
        try {
          // Clone response to capture raw body before parsing
          const clonedErrorResponse = response.clone()
          rawBody = await clonedErrorResponse.text()
          err = await response.json()
        } catch (parseError) {
          this.logger.error('Failed to parse error response', {
            statusCode: response.status,
            statusText: response.statusText,
            rawBody: rawBody,
            parseError:
              parseError instanceof Error ? parseError.message : parseError,
            context: LOGGING_CONTEXT,
          })
          err = { error: { detail: 'Failed to parse error response' } }
        }

        if (response.status === 404) {
          this.logger.error('TBR claim not found', {
            statusCode: response.status,
            error: err,
            detail: err?.error?.detail,
            context: LOGGING_CONTEXT,
          })

          throw new NotFoundException('TBR claim not found')
        }

        this.logger.error(`TBR request ${index !== undefined ? `#${index} ` : ''}failed`, {
          url: path,
          statusCode: response.status,
          context: LOGGING_CONTEXT,
          error: err,
          detail: err?.error?.detail,
        })

        throw new InternalServerErrorException('TBR request failed')
      }

      // Clone response to read body for logging without consuming it
      const clonedResponse = response.clone()
      let responseBody
      try {
        responseBody = await clonedResponse.json()
      } catch (parseError) {
        responseBody = await clonedResponse.text()
      }

      this.logger.info(`TBR request ${index !== undefined ? `#${index} ` : ''}successful`, {
        path: path,
        method: options?.method || 'GET',
        statusCode: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseBody: responseBody,
        context: LOGGING_CONTEXT,
      })

      return response
    } catch (error) {
      this.logger.error(`TBR request error when requesting ${index !== undefined ? `#${index} ` : ''}:`, {
        message: endpoint,
        url: path,
        context: LOGGING_CONTEXT,
        error: error,
        detail: error instanceof Error ? error.message : undefined,
      })
      throw error
    }
  }

  async postPayment(body: TBRPostPaymentBodyDto): Promise<void> {
    this.logger.info('Creating TBR claim', {
      advertId: body.id,
      context: LOGGING_CONTEXT,
    })

    await this.request('/claim', {
      method: 'POST',
      body: JSON.stringify({
        UUID: body.id,
        office: this.config.officeId,
        chargeCategory: body.chargeCategory,
        chargeBase: body.chargeBase,
        Expenses: body.expenses.map((ex) => ({
          FeeCode: ex.feeCode,
          Quantity: ex.quantity,
          Reference: ex.reference,
          Sum: ex.sum,
          UnitPrice: ex.unitPrice,
        })),
        debtorNationalId: body.debtorNationalId,
        employeeNationalId: body.debtorNationalId,
        extraData: [],
      }),
    })
  }

  async getPaymentStatus(
    query: TBRGetPaymentQueryDto,
    index?: number,
  ): Promise<TBRGetPaymentResponseDto> {
    const response = await this.request(
      `/claim/${query.debtorNationalId}?office=${this.config.officeId}&chargeCategory=${query.chargeCategory}&chargeBase=${query.chargeBase}`,
      {
        method: 'GET',
      },
      index,
    )

    const json = (await response.json()) as TBRGetPaymentResponse

    return {
      created: true,
      capital: json.result.capital,
      canceled: json.result.canceled,
      paid: json.result.capital === 0 && json.result.canceled === false,
    }
  }
}
