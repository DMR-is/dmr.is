import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Inject, Injectable, LoggerService } from '@nestjs/common'
import { JournalAdvert } from '../dto/journal-advert.dto'
import {
  ADVERT_B_1278_2023,
  ADVERT_B_866_2006,
  allMockAdvertDepartments,
} from '../mock/journal.mock'
import { IJournalService } from './journal.service.interface'
import { JournalAdvertDepartment } from '../dto/journal-department.dto'

const allMockAdverts = [ADVERT_B_1278_2023, ADVERT_B_866_2006]

const LOGGING_CATEGORY = 'MockJournalService'

@Injectable()
export class MockJournalService implements IJournalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: LoggerService) {
    this.logger.log('Using MockJournalService')
  }
  getAdvert(id: string): Promise<JournalAdvert | null> {
    this.logger.log('getAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { id },
    })
    const advert = allMockAdverts.find((advert) => advert.id === id)

    return Promise.resolve(advert ?? null)
  }

  getAdverts({ search }: { search?: string }): Promise<Array<JournalAdvert>> {
    this.logger.log('getAdverts', {
      category: LOGGING_CATEGORY,
      metadata: { search },
    })
    const filteredMockAdverts = allMockAdverts.filter((advert) => {
      if (!search) {
        return true
      }

      return advert.title.includes(search)
    })

    return Promise.resolve(filteredMockAdverts)
  }

  getDepartments({
    search,
  }: {
    search?: string | undefined
  }): Promise<JournalAdvertDepartment[]> {
    const mockDepartments = allMockAdvertDepartments

    const filtered = mockDepartments.filter((advert) => {
      if (!search) {
        return true
      }

      return advert.title.includes(search)
    })

    return Promise.resolve(filtered)
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }
}
