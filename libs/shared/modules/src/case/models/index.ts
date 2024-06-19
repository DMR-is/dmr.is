import { CaseDto } from './Case'
import { CaseChannelDto } from './CaseChannel'
import { CaseCommunicationStatusDto } from './CaseCommunicationStatus'
import { CaseStatusDto } from './CaseStatus'
import { CaseTagDto } from './CaseTag'
import { CaseChannelsDto } from './CaseChannels'

export {
  CaseDto,
  CaseTagDto,
  CaseStatusDto,
  CaseCommunicationStatusDto,
  CaseChannelDto,
  CaseChannelsDto,
}

export const models = [
  CaseDto,
  CaseTagDto,
  CaseStatusDto,
  CaseChannelDto,
  CaseCommunicationStatusDto,
  CaseChannelsDto,
]

export default models
