import { Advert } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IExternalService {
  publishRegulation(publishedCase: Advert): Promise<ResultWrapper>
}
export const IExternalService = Symbol('IExternalService')
