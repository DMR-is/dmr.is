import { CaseDto } from './Case'
import { CaseCategoriesDto } from './CaseCategories'
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
  CaseCategoriesDto,
  CaseChannelsDto,
]

export default models
