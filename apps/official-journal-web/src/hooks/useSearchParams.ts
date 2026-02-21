import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'

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
      search: parseAsString,
      department: parseAsArrayOf(
        parseAsStringEnum(Object.values(DepartmentEnum)),
      ),
      status: parseAsArrayOf(
        parseAsStringEnum<CaseStatusEnum>(Object.values(CaseStatusEnum)),
      ).withDefault([]),
      category: parseAsArrayOf(parseAsString),
      type: parseAsArrayOf(parseAsString),
      published: parseAsBoolean,
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(10),
      sortBy: parseAsString.withDefault(''),
      direction: parseAsString.withDefault('asc'),
    },
    {
      history: 'replace',
      shallow: true,
    },
  )

  return [searchParams, setSearchParams] as const
}
