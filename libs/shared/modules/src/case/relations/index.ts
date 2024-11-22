import { AdvertTypeModel } from '../../advert-type/models'
import { CaseCommentModel, CaseCommentTypeModel } from '../../comment/models'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
} from '../../journal/models'
import {
  SignatureMemberModel,
  SignatureModel,
  SignatureTypeModel,
} from '../../signature/models'
import {
  CaseAdditionModel,
  CaseChannelModel,
  CaseCommunicationStatusModel,
  CaseStatusModel,
  CaseTagModel,
} from '../models'

export const CASE_RELATIONS = [
  CaseTagModel,
  CaseStatusModel,
  CaseCommunicationStatusModel,
  AdvertDepartmentModel,
  AdvertTypeModel,
  AdvertCategoryModel,
  CaseChannelModel,
  AdvertInvolvedPartyModel,
  CaseAdditionModel,
  {
    model: CaseCommentModel,
    include: [CaseCommentTypeModel, CaseStatusModel],
  },
  {
    model: SignatureModel,
    include: [
      SignatureTypeModel,
      AdvertInvolvedPartyModel,
      {
        model: SignatureMemberModel,
        as: 'chairman',
      },
      {
        model: SignatureMemberModel,
        as: 'members',
      },
    ],
  },
]
