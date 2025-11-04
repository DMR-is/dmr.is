import { Inject, Injectable } from '@nestjs/common'

import { INationalRegistryService } from '@dmr.is/clients/national-registry'
import { GetPersonDto } from '@dmr.is/clients/national-registry'

import { ILGNationalRegistryService } from './national-registry.service.interface'

@Injectable()
export class LGNationalRegistryService implements ILGNationalRegistryService {
  constructor(
    @Inject(INationalRegistryService)
    private nationalRegistryService: INationalRegistryService,
  ) {}
  async getPersonByNationalId(nationalId: string): Promise<GetPersonDto> {
    return this.nationalRegistryService.getPersonByNationalId(nationalId)
  }
}
