import { Op } from 'sequelize'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { DefaultSearchParams } from '@dmr.is/shared/dto'

import { AdvertInvolvedPartyModel } from '../journal/models'
import { SignatureMemberModel, SignatureTypeModel } from './models'

export const getDefaultOptions = (params?: DefaultSearchParams) => {
  const page = params?.page || 1
  const pageSize = params?.pageSize || DEFAULT_PAGE_SIZE
  return {
    distinct: true,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    include: [
      {
        model: SignatureMemberModel,
        as: 'members',
      },
      {
        model: SignatureTypeModel,
        as: 'type',
      },
      {
        model: AdvertInvolvedPartyModel,
        as: 'involvedParty',
      },
    ],
  }
}

export type WhereParams = {
  search?: string
  involvedPartyId?: string
  caseId?: string
  advertId?: string
  signatureTypeId?: string
}

type WhereClause = {
  institution?: {
    [Op.like]: string
  }
  involvedPartyId?: {
    [Op.eq]: string
  }
}

export const signatureParams = (params?: WhereParams) => {
  // Initialize the where clause object must be declared inside the function to avoid side effects
  const whereClause: WhereClause = {}

  if (params?.search) {
    whereClause.institution = {
      [Op.like]: `%${params.search}%`,
    }
  }

  if (params?.involvedPartyId) {
    whereClause.involvedPartyId = {
      [Op.eq]: params.involvedPartyId,
    }
  }

  return whereClause
}
