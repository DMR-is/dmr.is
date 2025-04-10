import { Includeable } from 'sequelize'

import { AdvertTypeModel } from '../../advert-type/models'
import { CaseActionModel } from '../../comment/v2/models/case-action.model'
import { CommentModel } from '../../comment/v2/models/comment.model'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
} from '../../journal/models'
import { UserModel } from '../../user/models/user.model'
import { UserRoleModel } from '../../user/models/user-role.model'
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
  {
    model: CaseAdditionModel,
    through: {
      attributes: ['order'],
    },
  },
  {
    model: UserModel,
    include: [{ model: UserRoleModel }, { model: AdvertInvolvedPartyModel }],
  },
  {
    model: CaseTransactionModel,
  },
  {
    model: CommentModel,
    separate: true,
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
        model: UserModel,
        as: 'userCreator',
      },
      {
        model: UserModel,
        as: 'userReceiver',
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
      { model: UserModel },
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
