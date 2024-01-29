import { JournalAdvert } from '../dto/journal-advert.dto'
import { JournalAdvertDepartment } from '../dto/journal-department.dto'

export interface IJournalService {
  getAdverts({ search }: { search?: string }): Promise<Array<JournalAdvert>>
  getAdvert(id: string): Promise<JournalAdvert | null>
  getDepartments({
    search,
  }: {
    search?: string
  }): Promise<Array<JournalAdvertDepartment>>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
