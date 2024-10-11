import { CaseModel } from './case.model'
import { CaseCategoriesModel } from './case-categories.model'
import { CaseChannelModel } from './case-channel.model'
import { CaseChannelsModel } from './case-channels.model'
import { CaseCommunicationStatusModel } from './case-communication-status.model'
import { CasePublishedAdvertsModel } from './case-published-adverts'
import { CaseStatusModel } from './case-status.model'
import { CaseTagModel } from './case-tag.model'

export {
  CaseModel,
  CaseTagModel,
  CaseStatusModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseCommunicationStatusModel,
  CaseCategoriesModel,
  CasePublishedAdvertsModel,
}

export const models = [
  CaseModel,
  CaseTagModel,
  CaseStatusModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseCommunicationStatusModel,
  CaseCategoriesModel,
  CasePublishedAdvertsModel,
]

export default models
