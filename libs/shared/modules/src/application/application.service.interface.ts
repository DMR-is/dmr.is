import { Application, ApplicationEvent } from '@dmr.is/shared/dto'
import { ApplicationAnswers } from '@dmr.is/shared/dto'

export interface IApplicationService {
  getApplication(id: string): Promise<Application | null>

  updateApplication(
    id: string,
    event: ApplicationEvent,
    answers?: ApplicationAnswers,
  ): void
}

export const IApplicationService = Symbol('IApplicationService')
