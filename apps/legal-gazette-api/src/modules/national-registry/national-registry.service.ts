import Kennitala from 'kennitala'

import { Inject, Injectable } from '@nestjs/common'

import {
  GetCompanyDto,
  ICompanyRegistryClientService,
} from '@dmr.is/clients/company-registry'
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
    @Inject(ICompanyRegistryClientService)
    private companyRegistryService: ICompanyRegistryClientService,
  ) {}
  async getEntityNameByNationalId(nationalId: string): Promise<string> {
    if (Kennitala.isPerson(nationalId)) {
      const { person } = await this.getPersonByNationalId(nationalId)

      if (!person) {
        throw new Error('Person not found')
      }

      return person.nafn
    }

    const company = await this.getCompanyByNationalId(nationalId)

    if (!company.legalEntity) {
      throw new Error('Company not found')
    }

    return company.legalEntity.name
  }
  async getPersonByNationalId(nationalId: string): Promise<GetPersonDto> {
    try {
      return this.nationalRegistryService.getPersonByNationalId(nationalId)
    } catch (error) {
      this.logger.error(`Failed to get person by national id`, error)

      return { person: null }
    }
  }

  async getCompanyByNationalId(nationalId: string): Promise<GetCompanyDto> {
    try {
      return this.companyRegistryService.getCompany(nationalId)
    } catch (error) {
      this.logger.error(`Failed to get company by national id`, error)

      return { legalEntity: null }
    }
  }
}
