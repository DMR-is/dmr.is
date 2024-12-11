import useSWR from 'swr'

import { GetInstitutions } from '../../gen/fetch'
import { APIRotues, fetcherV2 } from '../../lib/constants'

type Props = {
  search?: string
  page?: number
  pageSize?: number
}

export const useInstitutions = ({
  search = '',
  page = 1,
  pageSize = 10,
}: Props = {}) => {
  const {
    data,
    isLoading: isLoadingInstitutions,
    error: institutionError,
    mutate: getInstitutions,
  } = useSWR<GetInstitutions, Error>(
    `${APIRotues.Institutions}?search=${search}&page=${page}&pageSize=${pageSize}`,
    (url: string) =>
      fetcherV2<GetInstitutions>(url, {
        arg: { method: 'GET' },
      }),
  )

  return {
    institutions: {
      institutions: data?.institutions,
      paging: data?.paging,
    },
    isLoadingInstitutions,
    institutionError,
    getInstitutions,
  }
}
