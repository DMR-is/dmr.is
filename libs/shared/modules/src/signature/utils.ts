import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { DefaultSearchParams } from '@dmr.is/shared/dto'

import { AdvertInvolvedPartyDTO } from '../journal/models'
import {
  SignatureMemberModel,
  SignatureModel,
  SignatureTypeModel,
} from './models'

export const getDefaultOptions = (params?: DefaultSearchParams) => {
  const page = params?.page || 1
  const pageSize = params?.pageSize || DEFAULT_PAGE_SIZE
  return {
    distinct: true,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    include: [
      {
        model: SignatureModel,
        include: [
          SignatureMemberModel,
          SignatureTypeModel,
          AdvertInvolvedPartyDTO,
        ],
      },
    ],
  }
}
