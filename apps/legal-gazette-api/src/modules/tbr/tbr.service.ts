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

    if (!this.config.tbrPath) {
      throw new Error('TBR path not provided')
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

    this.credentials = btoa(this.config.credentials)
    this.chargeCategoryPerson = process.env.LG_TBR_CHARGE_CATEGORY_PERSON
    this.chargeCategoryCompany = process.env.LG_TBR_CHARGE_CATEGORY_COMPANY
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private request(url: string, options?: Omit<RequestInit, 'headers'>) {
    return fetch(url, {
      headers: {
        Authorization: `Basic ${this.credentials}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 seconds
      ...options,
    })
  }

  async postPayment(body: TBRPostPaymentBodyDto): Promise<void> {
    const url = new URL(`${this.config.tbrPath}/claim`)

    const isPerson = Kennitala.isPerson(body.debtorNationalId)

    const response = await this.request(url.toString(), {
      method: 'POST',
      body: JSON.stringify({
        UUID: body.advertId,
        office: this.config.officeId,
        chargeCategory: isPerson
          ? this.chargeCategoryPerson
          : this.chargeCategoryCompany,
        chargeBase: body.chargeBase,
        Expenses: body.expenses,
        debtorNationalId: body.debtorNationalId,
        employeeNationalId: body.debtorNationalId,
      }),
    })

    if (!response.ok) {
      const json = await response.json()

      this.logger.error('TBR claim creation failed', {
        advertId: body.advertId,
        chargeBase: body.chargeBase,
        status: response.status,
        error: json?.error,
        detail: json?.error?.detail,
        context: 'TBRService',
      })

      throw new InternalServerErrorException('TBR claim creation failed')
    }
  }

  async getPaymentStatus(
    query: TBRGetPaymentQueryDto,
  ): Promise<TBRGetPaymentResponseDto> {
    const url = new URL(
      `${this.config.tbrPath}/claim/${query.debtorNationalId}`,
    )

    const isPerson = Kennitala.isPerson(query.debtorNationalId)

    url.searchParams.append('office', this.config.officeId)
    url.searchParams.append(
      'chargeCategory',
      isPerson ? this.chargeCategoryPerson : this.chargeCategoryCompany,
    )
    url.searchParams.append('chargeBase', query.chargeBase)

    const response = await this.request(url.toString(), {
      method: 'GET',
    })

    if (response.status === 404) {
      const json = await response.json()

      this.logger.error('TBR claim not found', {
        debtorNationalId: query.debtorNationalId,
        chargeBase: query.chargeBase,
        status: response.status,
        error: json?.error,
        detail: json?.error?.detail,
        context: 'TBRService',
      })

      throw new NotFoundException('TBR claim not found')
    }

    if (!response.ok) {
      const json = await response.json()

      this.logger.error('TBR claim request failed', {
        debtorNationalId: query.debtorNationalId,
        chargeBase: query.chargeBase,
        status: response.status,
        error: json?.error,
        detail: json?.error?.detail,
        context: 'TBRService',
      })

      throw new InternalServerErrorException('TBR claim request failed')
    }

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
