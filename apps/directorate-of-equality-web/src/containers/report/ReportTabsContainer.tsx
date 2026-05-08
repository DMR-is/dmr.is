'use client'

import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { ReportTabs } from '../../components/report/report-tabs/ReportTabs'
import { ReportDetailDto, ReportTypeEnum } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

type ReportTabsContainerProps = {
  report: ReportDetailDto
}

export function ReportTabsContainer({ report }: ReportTabsContainerProps) {
  const trpc = useTRPC()
  const isSalary = report.type === ReportTypeEnum.SALARY

  const { data: salaryStats, isLoading: salaryLoading } = useQuery({
    ...trpc.reportStatistics.baseSalaryByGenderAndScoreAll.queryOptions({
      reportId: report.id,
    }),
    enabled: isSalary,
  })

  if (isSalary && salaryLoading) {
    return <SkeletonLoader repeat={4} height={44} space={1} />
  }

  return <ReportTabs report={report} salaryStats={salaryStats} />
}
