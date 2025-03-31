import { useSession } from 'next-auth/react'
import useSWR from 'swr'

import {
  GetStatisticOverviewDashboardResponse,
  GetStatisticsDepartmentResponse,
  GetStatisticsForDepartmentRequest,
  GetStatisticsOverviewRequest,
} from '../../gen/fetch'
import { getDmrClient } from '../../lib/api/createClient'
import { APIRoutes, fetcher, swrFetcher } from '../../lib/constants'
import { generateParams } from '../../lib/utils'

type UseStatisticsParams = {
  departmentParams?: GetStatisticsForDepartmentRequest
  overviewParams?: GetStatisticsOverviewRequest
}

export const useStatistics = ({ departmentParams }: UseStatisticsParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.accessToken as string)

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
    data: overviewDashboard,
    isLoading: overviewDashboardLoading,
    error: overviewDashboardError,
  } = useSWR<GetStatisticOverviewDashboardResponse>(
    session ? ['getOverviewForDashboard', session?.user] : null,
    ([_key, _user]) => {
      return swrFetcher({
        func: () => dmrClient.getStatisticsOverviewDashboard(),
      })
    },

    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  const overViewDashboardData = Object.fromEntries(
    overviewDashboard?.items.map((item) => [
      item.overviewType,
      item.overview,
    ]) ?? [],
  )

  return {
    departmentStatistics,
    isLoadingDepartmentStatistics,
    errorDepartmentStatistics,
    overViewDashboardData,
    overviewDashboardLoading,
    overviewDashboardError,
  }
}
