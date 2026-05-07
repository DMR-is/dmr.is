'use client'

import { Tabs } from '@island.is/island-ui/core'

import { ReportDetailDto, ReportTypeEnum } from '../../../gen/fetch'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { SalaryDistributionChart } from './salary-tab/SalaryDistributionChart'
import { SalaryReportTab } from './salary-tab/SalaryReportTab'
import { CommentsForm } from './CommentsForm'

import { useQuery } from '@tanstack/react-query'

type ReportTabsProps = {
  report: ReportDetailDto
}

export function ReportTabs({ report }: ReportTabsProps) {
  const trpc = useTRPC()
  const isSalary = report.type === ReportTypeEnum.SALARY

  const { data: salaryStats } = useQuery({
    ...trpc.reportStatistics.baseSalaryByGenderAndScoreAll.queryOptions({
      reportId: report.id,
    }),
    enabled: isSalary,
  })

  const jafnrettisaetlun = {
    id: 'jafnrettisaetlun',
    label: 'Jafnréttisáætlun',
    content: <div>Jafnréttisáætlun</div>,
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
      label="Skýrsla"
      tabs={tabs}
      contentBackground="white"
      selected={tabs[0].id}
      />
    <CommentsForm reportId={report.id} />
      </>
  )
}
