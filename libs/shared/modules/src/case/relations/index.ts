import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from '../../comment/models'
import {
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertInvolvedPartyDTO,
  AdvertTypeDTO,
} from '../../journal/models'
import {
  SignatureMemberModel,
  SignatureModel,
  SignatureTypeModel,
} from '../../signature/models'
import {
  CaseChannelDto,
  CaseCommunicationStatusDto,
  CaseStatusDto,
  CaseTagDto,
} from '../models'

export const CASE_RELATIONS = [
  CaseTagDto,
  CaseStatusDto,
  CaseCommunicationStatusDto,
  AdvertDepartmentDTO,
  AdvertTypeDTO,
  AdvertCategoryDTO,
  CaseChannelDto,
  AdvertInvolvedPartyDTO,
  {
    model: CaseCommentDto,
    include: [
      {
        model: CaseCommentTaskDto,
        include: [CaseCommentTitleDto],
      },
      CaseStatusDto,
      CaseCommentTypeDto,
    ],
  },
  {
    model: SignatureModel,
    include: [
      SignatureTypeModel,
      AdvertInvolvedPartyDTO,
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
