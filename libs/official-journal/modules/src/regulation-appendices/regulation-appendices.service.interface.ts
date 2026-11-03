import { GetRegulationAppendicesResponse } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IRegulationAppendicesService {
  /**
   * Appendices of published B-deild adverts, looked up by publication number.
   * Built for the regulation importer, which gets regulations from the old
   * system without their appendices.
   */
  getAppendices(
    publicationNumbers: string[],
  ): Promise<ResultWrapper<GetRegulationAppendicesResponse>>
}

export const IRegulationAppendicesService = Symbol(
  'IRegulationAppendicesService',
)
