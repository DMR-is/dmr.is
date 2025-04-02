import { ResultWrapper } from '@dmr.is/types'
import { GetTagsResponse } from './dto/case-tag.dto'

export interface ICaseTagService {
  getTags(): Promise<ResultWrapper<GetTagsResponse>>
}

export const ICaseTagService = Symbol('ICaseTagService')
