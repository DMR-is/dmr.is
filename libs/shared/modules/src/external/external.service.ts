import * as crypto from 'crypto'
import format from 'date-fns/format'
import { Logger } from 'winston'

import { Inject, Injectable } from '@nestjs/common'

import { LogAndHandle } from '@dmr.is/decorators'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Advert } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { IExternalService } from './external.service.interface'
import { advertsToRegulations } from './external.service.util'

const LOGGING_CATEGORY = 'case-service'
const LOGGING_QUERY = 'CaseServiceQueryRunner'

@Injectable()
export class ExternalService implements IExternalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using ExternalService')
  }

  @LogAndHandle()
  async publishRegulation(publishedAdvert: Advert): Promise<ResultWrapper> {
    const regulation = advertsToRegulations(publishedAdvert)

    const xHxmDate = format(new Date(), "yyyy-MM-dd HH':'mm':'ss")

    const xHxmServiceKey = process.env.REGULATION_SERVICE_KEY
    const xHxmAccessKey = process.env.REGULATION_ACCESS_KEY
    const secretKey = process.env.REGULATION_SECRET_KEY as string

    const signatureInput =
      xHxmDate +
      '|' +
      xHxmServiceKey +
      '|' +
      xHxmAccessKey +
      '|' +
      '/api/v1/advert'

    const calculatedHash = crypto
      .createHmac('sha1', secretKey)
      .update(signatureInput)
      .digest('base64')
    const data = await fetch(
      'https://reglugerd-import.eplica.is/api/v1/advert',
      {
        method: 'POST',

        body: JSON.stringify(regulation),
        headers: {
          'Content-Type': 'application/json',
          'X-Hxm-Signature': calculatedHash,
          'X-Hxm-ServiceKey': xHxmServiceKey || '',
          'X-Hxm-AccessKey': xHxmAccessKey || '',
          'X-Hxm-ApiMethod': '/api/v1/advert',
          'X-Hxm-Date': xHxmDate,
        },
      },
    ).then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`)
      }
      return response.json()
    })
    return Promise.resolve(ResultWrapper.ok())
  }
}
