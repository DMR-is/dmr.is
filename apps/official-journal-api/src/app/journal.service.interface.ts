import { JournalAdvert } from '../dto/journal-advert.dto'
import { JournalValidationResponse } from '../lib/types'

export interface IJournalService {
  getAdverts({ search }: { search?: string }): Promise<Array<JournalAdvert>>
  getAdvert(id: string): Promise<JournalAdvert | null>
  validateAdvert(advert: JournalAdvert): Promise<JournalValidationResponse>
  submitAdvert(advert: JournalAdvert): Promise<JournalValidationResponse>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
