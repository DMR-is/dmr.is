import {
  ApplicationAttachmentModel,
  ApplicationAttachmentTypeModel,
} from '../../attachments/models'
import {
  CaseCommentModel,
  CaseCommentTaskModel,
  CaseCommentTitleModel,
  CaseCommentTypeModel,
} from '../../comment/models'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertTypeModel,
} from '../../journal/models'
import {
  SignatureMemberModel,
  SignatureModel,
  SignatureTypeModel,
} from '../../signature/models'
import {
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
  {
    model: ApplicationAttachmentModel,
    include: [ApplicationAttachmentTypeModel],
  },
  {
    model: CaseCommentModel,
    include: [
      {
        model: CaseCommentTaskModel,
        include: [CaseCommentTitleModel],
      },
      CaseStatusModel,
      CaseCommentTypeModel,
    ],
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
