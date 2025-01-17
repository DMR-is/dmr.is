import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'next-usequerystate'

import { CaseStatusEnum, DepartmentEnum } from '../gen/fetch'

/**
 * Hook that returns the search params from the query string
 * and updates the query string with new search params.
 *
 * **MUST BE DYNAMICALLY IMPORTED!!**
 */
export const useSearchParams = () => {
  const [searchParams, setSearchParams] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      department: parseAsArrayOf(
        parseAsStringEnum(Object.values(DepartmentEnum)),
      ).withDefault([]),
      status: parseAsArrayOf(
        parseAsStringEnum<CaseStatusEnum>(Object.values(CaseStatusEnum)),
      ).withDefault([]),
      category: parseAsArrayOf(parseAsString).withDefault([]),
      type: parseAsArrayOf(parseAsString).withDefault([]),
      published: parseAsBoolean,
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(10),
    },
    {
      history: 'replace',
      shallow: true,
    },
  )

  return [searchParams, setSearchParams] as const
}
