import { Includeable } from 'sequelize'

import { AdminUserModel } from '../../admin-user/models/admin-user.model'
import { AdminUserRoleModel } from '../../admin-user/models/user-role.model'
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
import { matchByIdTitleOrSlug } from '../mappers/case-parameters.mapper'
import {
  CaseAdditionModel,
  CaseChannelModel,
  CaseCommunicationStatusModel,
  CaseStatusModel,
  CaseTagModel,
} from '../models'

export const casesDetailedIncludes = [
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
    model: AdminUserModel,
    include: [{ model: AdminUserRoleModel }],
  },
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

type CaseIncludeFilters = {
  department?: string | string[]
  type?: string | string[]
  status?: string | string[]
  institution?: string | string[]
  category?: string | string[]
}
export const casesIncludes = (params: CaseIncludeFilters): Includeable[] => [
  {
    model: CaseStatusModel,
    attributes: ['id', 'title', 'slug'],
    where: matchByIdTitleOrSlug(params?.status),
  },
  {
    model: AdvertDepartmentModel,
    attributes: ['id', 'title', 'slug'],
    where: matchByIdTitleOrSlug(params?.department),
  },
  {
    model: AdvertTypeModel,
    attributes: ['id', 'title', 'slug'],
    where: matchByIdTitleOrSlug(params?.type),
  },
  {
    model: AdvertInvolvedPartyModel,
    attributes: ['id', 'title', 'slug'],
    where: matchByIdTitleOrSlug(params?.institution),
  },
  {
    model: AdvertCategoryModel,
    attributes: ['id', 'title', 'slug'],
    where: matchByIdTitleOrSlug(params?.category),
    required: false,
  },
  {
    model: CaseCommunicationStatusModel,
    attributes: ['id', 'title', 'slug'],
  },
  {
    model: CaseTagModel,
    attributes: ['id', 'title', 'slug'],
  },
]
