import {
  BadGatewayException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { getApiErrorMessage } from '@dmr.is/utils-server/httpUtils'

import { getNationalid, getNationalidOverview } from '../gen/fetch'
import type { LegalEntityDto } from './dto/legal-entity.dto'
import { mapLegalEntityResponse } from './dto/legal-entity.mapper'
import { rskCompanyRegistryClient } from './rsk-company-registry.config'
import {
  IRskCompanyRegistryService,
  RskLanguage,
} from './rsk-company-registry.service.interface'

const LOGGING_CONTEXT = 'RskCompanyRegistryService'

@Injectable()
export class RskCompanyRegistryService implements IRskCompanyRegistryService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async getLegalEntityByNationalId(
    nationalId: string,
    language?: RskLanguage,
  ): Promise<LegalEntityDto> {
    this.logger.info('Fetching legal entity from RSK company registry', {
      context: LOGGING_CONTEXT,
    })

    const { data, error, response } = await getNationalid({
      client: rskCompanyRegistryClient,
      path: { nationalId },
      query: language ? { language } : undefined,
    })

    if (error || !data) {
      this.logger.error('Failed to fetch legal entity from RSK company registry', {
        context: LOGGING_CONTEXT,
        statusCode: response?.status,
        error,
      })
      // A 404 means the legal entity simply does not exist — surface that
      // distinctly so callers can tell "not found" apart from a registry
      // outage (which stays a 502 Bad Gateway).
      if (response?.status === 404) {
        throw new NotFoundException(
          `RSK company registry has no legal entity for national id "${nationalId}"`,
        )
      }
      throw new BadGatewayException(
        `RSK company registry legal entity lookup failed: ${getApiErrorMessage(error)}`,
      )
    }

    this.logger.info(
      'Successfully fetched legal entity from RSK company registry',
      { context: LOGGING_CONTEXT },
    )

    return mapLegalEntityResponse(data)
  }

  async getLegalEntityOverview(
    nationalId: string,
    language?: RskLanguage,
  ): Promise<Buffer> {
    this.logger.info(
      'Fetching legal entity overview PDF from RSK company registry',
      { context: LOGGING_CONTEXT },
    )

    const { data, error, response } = await getNationalidOverview({
      client: rskCompanyRegistryClient,
      path: { nationalId },
      query: language ? { language } : undefined,
      parseAs: 'blob',
    })

    if (error || !data) {
      this.logger.error(
        'Failed to fetch legal entity overview PDF from RSK company registry',
        {
          context: LOGGING_CONTEXT,
          statusCode: response?.status,
          error,
        },
      )
      throw new BadGatewayException(
        `RSK company registry legal entity overview failed: ${getApiErrorMessage(error)}`,
      )
    }

    this.logger.info(
      'Successfully fetched legal entity overview PDF from RSK company registry',
      { context: LOGGING_CONTEXT },
    )

    return Buffer.from(await data.arrayBuffer())
  }
}
