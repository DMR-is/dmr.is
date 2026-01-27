import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import {
  GetNationalRegistryEntityDto,
  INationalRegistryService,
} from '@dmr.is/clients/national-registry'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ILGNationalRegistryService } from './national-registry.service.interface'

const LOGGING_CONTEXT = 'LGNationalRegistryService'
@Injectable()
export class LGNationalRegistryService implements ILGNationalRegistryService {
  constructor(
    @Inject(LOGGER_PROVIDER) private logger: Logger,
    @Inject(INationalRegistryService)
    private nationalRegistryService: INationalRegistryService,
  ) {}
  async getEntityNameByNationalId(nationalId: string): Promise<string> {
    const { entity } = await this.getEntityByNationalId(nationalId)

    if (!entity) {
      throw new NotFoundException('National registry entity not found')
    }

    return entity.nafn
  }
  async getEntityByNationalId(
    nationalId: string,
  ): Promise<GetNationalRegistryEntityDto> {
    try {
      return this.nationalRegistryService.getEntityByNationalId(nationalId)
    } catch (error) {
      this.logger.error(`Failed to get national registry entity`, error, {
        context: LOGGING_CONTEXT,
      })

      return { entity: null }
    }
  }
}
