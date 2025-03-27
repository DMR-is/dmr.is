import {
  CaseTagModel,
  CaseStatusModel,
  CaseCommunicationStatusModel,
  AdvertDepartmentModel,
  AdvertTypeModel,
  AdvertCategoryModel,
  CaseChannelModel,
  AdvertInvolvedPartyModel,
  CaseAdditionModel,
  UserModel,
  UserRoleModel,
  CaseTransactionModel,
  CommentModel,
  CaseActionModel,
  CaseHistoryModel,
} from '@dmr.is/official-journal/models'
import { Includeable } from 'sequelize'
import { matchByIdTitleOrSlug } from '../mappers/case-parameters.mapper'

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
