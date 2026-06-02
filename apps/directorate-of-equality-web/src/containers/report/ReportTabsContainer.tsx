'use client'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { ReportTabs } from '../../components/report/report-tabs/ReportTabs'
import { ReportDetailDto, ReportTypeEnum } from '../../gen/fetch'
import { reportText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

type ReportTabsContainerProps = {
  report: ReportDetailDto
}

export function ReportTabsContainer({ report }: ReportTabsContainerProps) {
  const trpc = useTRPC()
  const isSalary = report.type === ReportTypeEnum.SALARY

  const {
    data: salaryStats,
    isLoading: salaryLoading,
    isError: salaryError,
  } = useQuery({
    ...trpc.reportStatistics.baseSalaryByGenderAndScoreAll.queryOptions({
      reportId: report.id,
    }),
    enabled: isSalary,
  })

  if (isSalary && salaryLoading) {
    return <SkeletonLoader repeat={4} height={44} space={1} />
  }

  if (isSalary && salaryError) {
    return (
      <AlertMessage
        type="error"
        title={reportText.salaryStatsLoadError}
        message=""
      />
    )
  }

  return <ReportTabs report={report} salaryStats={salaryStats} />
}
