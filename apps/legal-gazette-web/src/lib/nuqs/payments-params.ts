import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsStringEnum,
} from 'nuqs/server'

import {
  TBRTransactionStatus,
  TBRTransactionType,
} from '../../gen/fetch'

export const paymentsParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  type: parseAsStringEnum(Object.values(TBRTransactionType)),
  status: parseAsStringEnum(Object.values(TBRTransactionStatus)),
  paid: parseAsBoolean,
}

export const paymentsParamsCache = createSearchParamsCache(paymentsParams)
