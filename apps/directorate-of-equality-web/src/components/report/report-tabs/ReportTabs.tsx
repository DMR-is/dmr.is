'use client'

import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { Tabs } from '@island.is/island-ui/core'

import { ReportDetailDto, ReportTypeEnum } from '../../../gen/fetch'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { EqualityReportTab } from './equality-tab/EqualityReportTab'
import { SalaryReportTab } from './salary-tab/SalaryReportTab'
import { CommentsForm } from './CommentsForm'

import { useQuery } from '@tanstack/react-query'

type ReportTabsProps = {
  report: ReportDetailDto
}

export function ReportTabs({ report }: ReportTabsProps) {
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

  const jafnrettisaetlun = {
    id: 'jafnrettisaetlun',
    label: 'Jafnréttisáætlun',
    content: <EqualityReportTab equalityReportContent={report.equalityReportContent ?? report.equalityReport.content} />,
  }

  const fyrirtaekid = {
    id: 'fyrirtaekid',
    label: 'Fyrirtækið',
    content: <div>Fyrirtækið</div>,
  }

  const tabs = isSalary && salaryStats
    ? [
        {
          id: 'launagreining',
          label: 'Launagreining',
          content: <SalaryReportTab reportId={report.id} data={salaryStats} outliers={report.employeeOutliers}  outlierDate={report.correctionDeadline ? new Date(report.correctionDeadline) : undefined}/>,
        },
        jafnrettisaetlun,
        fyrirtaekid,
      ]
    : [jafnrettisaetlun, fyrirtaekid]

  return (
    <>
    <Tabs
      key={tabs.map((t) => t.id).join(',')}
      label="Skýrsla"
      tabs={tabs}
      contentBackground="white"
      selected={tabs[0].id}
      />
    <CommentsForm reportId={report.id} />
      </>
  )
}
