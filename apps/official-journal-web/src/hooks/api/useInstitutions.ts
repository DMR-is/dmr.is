import useSWR, { SWRConfiguration } from 'swr'

import { GetInstitutions, GetInstitutionsRequest } from '../../gen/fetch'
import { APIRotues, fetcherV2 } from '../../lib/constants'

type Props = {
  searchParams: Record<
    keyof GetInstitutionsRequest,
    string | number | undefined
  >
  config: SWRConfiguration
}

export const useInstitutions = ({ searchParams, config }: Props) => {
  const {
    data,
    isLoading: isLoadingInstitutions,
    error: institutionError,
    mutate: getInstitutions,
  } = useSWR<GetInstitutions, Error>(
    [APIRotues.Institutions, searchParams],
    ([url, qp]) => {
      const qsp = new URLSearchParams()

      if (qp) {
        for (const [key, value] of Object.entries(qp)) {
          if (value) {
            qsp.append(key, value)
          }
        }
      }
      return fetcherV2<GetInstitutions>(url, {
        arg: { method: 'GET', query: qsp },
      })
    },
    config,
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
