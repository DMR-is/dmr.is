import { ResultWrapper } from '@dmr.is/types'
import { CreateCaseChannelBody } from './dto/case-channel.dto'

export interface ICaseChannelService {
  createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
  ): Promise<ResultWrapper>

  deleteCaseChannel(caseId: string, channelId: string): Promise<ResultWrapper>
}

export const ICaseChannelService = Symbol('ICaseChannelService')
