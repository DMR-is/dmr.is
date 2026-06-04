'use client'

import { useEffect, useState } from 'react'

import { Tabs } from '@island.is/island-ui/core'

import { CommentsContainer } from '../../../containers/report/CommentsContainer'
import {
  ReportDetailDto,
  ReportOutlierSortByEnum,
  ReportTypeEnum,
  SalaryByGenderAndScoreDto,
  SortDirectionEnum,
} from '../../../gen/fetch'
import { reportText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { CompanyInfoTab } from './company-tab/CompanyInfoTab'
import { EqualityReportTab } from './equality-tab/EqualityReportTab'
import { SalaryReportTab } from './salary-tab/SalaryReportTab'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { type SortingState } from '@tanstack/react-table'

type ReportTabsProps = {
  report: ReportDetailDto
  salaryStats?: SalaryByGenderAndScoreDto
}

const OUTLIERS_PAGE_SIZE = 10

export function ReportTabs({ report, salaryStats }: ReportTabsProps) {
  const trpc = useTRPC()
  const isSalary = report.type === ReportTypeEnum.SALARY
  const [selectedTab, setSelectedTab] = useState(
    isSalary ? 'launagreining' : 'jafnrettisaetlun',
  )
  const [outliersPage, setOutliersPage] = useState(1)
  const [outliersSorting, setOutliersSorting] = useState<SortingState>([])

  useEffect(() => {
    setOutliersPage(1)
  }, [report.id])

  const outlierSortBy = outliersSorting[0]?.id as
    | ReportOutlierSortByEnum
    | undefined
  const outlierDirection = outliersSorting[0]
    ? outliersSorting[0].desc
      ? SortDirectionEnum.DESC
      : SortDirectionEnum.ASC
    : undefined

  const handleOutliersSortingChange = (next: SortingState) => {
    setOutliersSorting(next)
    setOutliersPage(1)
  }

  const { data: outliersData, isLoading: outliersLoading } = useQuery({
    ...trpc.reports.getOutliers.queryOptions({
      id: report.id,
      page: outliersPage,
      pageSize: OUTLIERS_PAGE_SIZE,
      sortBy: outlierSortBy,
      direction: outlierDirection,
    }),
    enabled: isSalary && report.includesImprovementPlan,
    placeholderData: keepPreviousData,
  })

  const jafnrettisaetlun = {
    id: 'jafnrettisaetlun',
    label: reportText.tabEquality,
    content: (
      <EqualityReportTab
        report={report.equalityReport}
        supervisor={report.contactName ?? undefined}
      />
    ),
  }

  const fyrirtaekid = {
    id: 'fyrirtaekid',
    label: reportText.tabCompany,
    content: (
      <CompanyInfoTab
        company={report.company}
        admin={{
          email: report.companyAdminEmail ?? undefined,
          name: report.companyAdminName ?? undefined,
          gender: report.companyAdminGender ?? undefined,
        }}
        contactPerson={{
          email: report.contactEmail ?? undefined,
          name: report.contactName ?? undefined,
          phone: report.contactPhone ?? undefined,
        }}
        employees={{
          womenCount: report.averageEmployeeFemaleCount ?? undefined,
          menCount: report.averageEmployeeMaleCount ?? undefined,
          otherCount: report.averageEmployeeNeutralCount ?? undefined,
        }}
        subsidaries={report.subsidiaries?.map((dc) => ({
          name: dc.name ?? undefined,
          nationalId: dc.nationalId ?? undefined,
        }))}
      />
    ),
  }

  const tabs =
    isSalary && salaryStats
      ? [
          {
            id: 'launagreining',
            label: reportText.tabSalary,
            content: (
              <SalaryReportTab
                data={salaryStats}
                outliers={outliersData?.outliers ?? []}
                outliersPostponed={
                  report.status.match(/postponed/i) ? true : false
                }
                outliersPaging={outliersData?.paging}
                outliersLoading={outliersLoading}
                onOutliersPageChange={setOutliersPage}
                outliersSorting={outliersSorting}
                onOutliersSortingChange={handleOutliersSortingChange}
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
        label={reportText.tabsLabel}
        tabs={tabs}
        contentBackground="white"
        selected={selectedTab}
        onChange={setSelectedTab}
      />
      <CommentsContainer reportId={report.id} />
    </>
  )
}
