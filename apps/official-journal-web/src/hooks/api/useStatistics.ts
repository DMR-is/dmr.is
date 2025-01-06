import useSWR from 'swr'

import {
  GetStatisticsDepartmentResponse,
  GetStatisticsForDepartmentRequest,
  GetStatisticsOverviewRequest,
  GetStatisticsOverviewResponse,
} from '../../gen/fetch'
import { APIRoutes, fetcher } from '../../lib/constants'
import { generateParams } from '../../lib/utils'

type UseStatisticsParams = {
  departmentParams?: GetStatisticsForDepartmentRequest
  overviewParams?: GetStatisticsOverviewRequest
}

export const useStatistics = ({
  departmentParams,
  overviewParams,
}: UseStatisticsParams) => {
  const {
    data: departmentStatistics,
    isLoading: isLoadingDepartmentStatistics,
    error: errorDepartmentStatistics,
  } = useSWR<GetStatisticsDepartmentResponse>(
    departmentParams
      ? [APIRoutes.GetStatisticsForDepartment, departmentParams]
      : null,
    ([url, qsp]: [url: string, qsp: GetStatisticsForDepartmentRequest]) =>
      fetcher<GetStatisticsDepartmentResponse>(url, {
        arg: {
          method: 'GET',
          query: generateParams(qsp),
          withAuth: true,
        },
      }),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    error: errorOverview,
  } = useSWR<GetStatisticsOverviewResponse>(
    overviewParams ? [APIRoutes.GetStatisticsOverview, overviewParams] : null,
    ([url, qsp]: [url: string, qsp: GetStatisticsOverviewRequest]) =>
      fetcher<GetStatisticsOverviewResponse>(url, {
        arg: {
          method: 'GET',
          query: generateParams(qsp),
          withAuth: true,
        },
      }),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  return {
    departmentStatistics,
    isLoadingDepartmentStatistics,
    errorDepartmentStatistics,
    overviewData,
    isLoadingOverview,
    errorOverview,
  }
}
