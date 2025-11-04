import { Inject, Injectable } from '@nestjs/common'

import { INationalRegistryService } from '@dmr.is/clients/national-registry'
import { GetPersonDto } from '@dmr.is/clients/national-registry'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ILGNationalRegistryService } from './national-registry.service.interface'

@Injectable()
export class LGNationalRegistryService implements ILGNationalRegistryService {
  constructor(
    @Inject(LOGGER_PROVIDER) private logger: Logger,
    @Inject(INationalRegistryService)
    private nationalRegistryService: INationalRegistryService,
  ) {}
  async getPersonByNationalId(nationalId: string): Promise<GetPersonDto> {
    try {
      return this.nationalRegistryService.getPersonByNationalId(nationalId)
    } catch (error) {
      this.logger.error(`Failed to get person by national id`, error)

      return { person: null }
    }
  }
}
