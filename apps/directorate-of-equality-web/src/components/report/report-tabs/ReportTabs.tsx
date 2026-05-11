'use client'

import { useState } from 'react'

import { Tabs } from '@island.is/island-ui/core'

import { CommentsContainer } from '../../../containers/report/CommentsContainer'
import {
  ReportDetailDto,
  ReportTypeEnum,
  SalaryByGenderAndScoreDto,
} from '../../../gen/fetch'
import { EqualityReportTab } from './equality-tab/EqualityReportTab'
import { SalaryReportTab } from './salary-tab/SalaryReportTab'

type ReportTabsProps = {
  report: ReportDetailDto
  salaryStats?: SalaryByGenderAndScoreDto
}

export function ReportTabs({ report, salaryStats }: ReportTabsProps) {
  const isSalary = report.type === ReportTypeEnum.SALARY
  const [selectedTab, setSelectedTab] = useState(
    isSalary ? 'launagreining' : 'jafnrettisaetlun',
  )

  const jafnrettisaetlun = {
    id: 'jafnrettisaetlun',
    label: 'Jafnréttisáætlun',
    content: <EqualityReportTab report={report.equalityReport} />,
  }

  const fyrirtaekid = {
    id: 'fyrirtaekid',
    label: 'Fyrirtækið',
    content: <div>Fyrirtækið</div>,
  }

  const tabs =
    isSalary && salaryStats
      ? [
          {
            id: 'launagreining',
            label: 'Launagreining',
            content: (
              <SalaryReportTab
                data={salaryStats}
                outliers={report.employeeOutliers}
                outlierDate={
                  report.correctionDeadline
                    ? new Date(report.correctionDeadline)
                    : undefined
                }
              />
            ),
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
        selected={selectedTab}
        onChange={setSelectedTab}
      />
      <CommentsContainer reportId={report.id} />
    </>
  )
}
