import { CaseDto } from './Case'
import { CaseChannelDto } from './CaseChannel'
import { CaseChannelsDto } from './CaseChannels'
import { CaseCommunicationStatusDto } from './CaseCommunicationStatus'
import { CaseStatusDto } from './CaseStatus'
import { CaseTagDto } from './CaseTag'

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
