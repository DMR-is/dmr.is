import Kennitala from 'kennitala'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  TBRGetPaymentQueryDto,
  TBRGetPaymentResponseDto,
  TBRPostPaymentBodyDto,
} from './dto/tbr.dto'
import { ITBRConfig } from './tbr.config'
import { ITBRService } from './tbr.service.interface'

type TBRPathString = `/${string}`

@Injectable()
export class TBRService implements ITBRService {
  private readonly credentials: string
  private chargeCategoryPerson: string
  private chargeCategoryCompany: string
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
    this.chargeCategoryPerson = process.env.LG_TBR_CHARGE_CATEGORY_PERSON
    this.chargeCategoryCompany = process.env.LG_TBR_CHARGE_CATEGORY_COMPANY
  }

  private async request(
    path: TBRPathString,
    options?: Omit<RequestInit, 'headers'>,
  ) {
    const endpoint = new URL(`${this.config.tbrBasePath}${path}`).toString()

    this.logger.info('Making TBR request to:', {
      message: endpoint,
      path: path,
      method: options?.method || 'GET',
      context: 'TBRService',
    })

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Basic ${this.credentials}`,
        'Content-Type': 'application/json',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        'X-Road-Client': process.env.XROAD_DMR_CLIENT!,
      },
      signal: AbortSignal.timeout(10000), // 10 seconds
      ...options,
    })

    if (!response.ok) {
      const err = await response.json()
      if (response.status === 404) {
        this.logger.error('TBR claim not found', {
          status: response.status,
          error: err?.error,
          detail: err?.error?.detail,
          context: 'TBRService',
        })

        throw new NotFoundException('TBR claim not found')
      }

      this.logger.error('TBR request failed', {
        url: path,
        status: response.status,
        context: 'TBRService',
        detail: err,
      })

      throw new InternalServerErrorException('TBR request failed')
    }

    return response
  }

  async postPayment(body: TBRPostPaymentBodyDto): Promise<void> {
    this.logger.info('Creating TBR claim', {
      advertId: body.advertId,
    })

    const isPerson = Kennitala.isPerson(body.debtorNationalId)

    await this.request('/claim', {
      method: 'POST',
      body: JSON.stringify({
        UUID: body.advertId,
        office: this.config.officeId,
        chargeCategory: isPerson
          ? this.chargeCategoryPerson
          : this.chargeCategoryCompany,
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
  ): Promise<TBRGetPaymentResponseDto> {
    const isPerson = Kennitala.isPerson(query.debtorNationalId)

    const response = await this.request(
      `/claim/${query.debtorNationalId}?office=${this.config.officeId}&chargeCategory=${isPerson ? this.chargeCategoryPerson : this.chargeCategoryCompany}&chargeBase=${query.chargeBase}`,
      {
        method: 'GET',
      },
    )

    const json = await response.json()

    if (!json.paymentStatus) {
      this.logger.error('TBR claim response missing paymentStatus', {
        debtorNationalId: query.debtorNationalId,
        chargeBase: query.chargeBase,
        status: response.status,
        response: json,
        context: 'TBRService',
      })

      throw new InternalServerErrorException(
        'TBR claim response missing paymentStatus',
      )
    }

    return {
      created: true,
      capital: json.result.capital,
      canceled: json.result.canceled,
      paid: json.result.capital === 0 && json.result.canceled === false,
    }
  }
}
