import { Advert, RegulationDraft } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IRegulationPublishService {
  publishRegulationDirectly(
    draft: RegulationDraft,
    publishedDate: Date,
    advert: Advert,
  ): Promise<ResultWrapper>
  hasPendingTasks(
    baseRegulationName: string,
  ): Promise<ResultWrapper<boolean>>
}

export const IRegulationPublishService = Symbol('IRegulationPublishService')
