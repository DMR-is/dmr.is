import { Includeable } from 'sequelize'

import { AdminUserModel } from '../../admin-user/models/admin-user.model'
import { AdminUserRoleModel } from '../../admin-user/models/user-role.model'
import { AdvertTypeModel } from '../../advert-type/models'
import { ApplicationUserModel } from '../../application-user/models'
import { CaseActionModel } from '../../comment/v2/models/case-action.model'
import { CommentModel } from '../../comment/v2/models/comment.model'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
} from '../../journal/models'
import { matchByIdTitleOrSlug } from '../mappers/case-parameters.mapper'
import {
  CaseAdditionModel,
  CaseChannelModel,
  CaseCommunicationStatusModel,
  CaseStatusModel,
  CaseTagModel,
  CaseTransactionModel,
} from '../models'
import { CaseHistoryModel } from '../models/case-history.model'

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
    model: CaseTransactionModel,
  },
  {
    model: CommentModel,
    include: [
      {
        model: CaseStatusModel,
        attributes: ['id', 'title', 'slug'],
        as: 'createdCaseStatus',
      },
      {
        model: CaseActionModel,
        attributes: ['id', 'title', 'slug'],
      },
      {
        model: AdminUserModel,
        as: 'adminUserCreator',
      },
      {
        model: AdminUserModel,
        as: 'adminUserReceiver',
      },
      {
        model: ApplicationUserModel,
        include: [
          {
            model: AdvertInvolvedPartyModel,
          },
        ],
      },
      {
        model: AdvertInvolvedPartyModel,
        attributes: ['id', 'title', 'slug'],
      },
      {
        model: CaseStatusModel,
        attributes: ['id', 'title', 'slug'],
        as: 'caseStatusReceiver',
      },
    ],
  },
  {
    model: CaseHistoryModel,
    include: [
      { model: CaseStatusModel, attributes: ['id', 'title', 'slug'] },
      { model: AdvertDepartmentModel, attributes: ['id', 'title', 'slug'] },
      { model: AdvertTypeModel, attributes: ['id', 'title', 'slug'] },
      { model: AdvertInvolvedPartyModel, attributes: ['id', 'title', 'slug'] },
      { model: AdminUserModel },
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
