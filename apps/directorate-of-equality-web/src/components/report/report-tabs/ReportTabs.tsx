'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { Tabs } from '@island.is/island-ui/core'

import { CommentsContainer } from '../../../containers/report/CommentsContainer'
import {
  ReportDetailDto,
  ReportTypeEnum,
  SalaryByGenderAndScoreDto,
} from '../../../gen/fetch'
import { reportText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { CompanyInfoTab } from './company-tab/CompanyInfoTab'
import { EqualityReportTab } from './equality-tab/EqualityReportTab'
import { SalaryReportTab } from './salary-tab/SalaryReportTab'

type ReportTabsProps = {
  report: ReportDetailDto
  salaryStats?: SalaryByGenderAndScoreDto
}

export function ReportTabs({ report, salaryStats }: ReportTabsProps) {
  const trpc = useTRPC()
  const isSalary = report.type === ReportTypeEnum.SALARY
  const [selectedTab, setSelectedTab] = useState(
    isSalary ? 'launagreining' : 'jafnrettisaetlun',
  )

  const { data: groupsData } = useQuery({
    ...trpc.reports.getOutlierGroups.queryOptions({ id: report.id }),
    enabled: isSalary && report.includesImprovementPlan,
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
                reportId={report.id}
                groups={groupsData?.groups ?? []}
                outliersPostponed={
                  report.status.match(/postponed/i) ? true : false
                }
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
