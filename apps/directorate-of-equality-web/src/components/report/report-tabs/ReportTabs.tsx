'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { Tabs } from '@island.is/island-ui/core'

import { CommentsContainer } from '../../../containers/report/CommentsContainer'
import {
  EmployeeCountHistoryEntryDto,
  ReportDetailDto,
  ReportTypeEnum,
  SalaryByGenderAndScoreDto,
} from '../../../gen/fetch'
import {
  EMPLOYEE_COUNT_HISTORY_ANCHOR,
  NAV_PATHS,
} from '../../../lib/constants'
import { reportText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { CompanyInfoTab } from './company-tab/CompanyInfoTab'
import { EqualityReportTab } from './equality-tab/EqualityReportTab'
import { SalaryReportTab } from './salary-tab/SalaryReportTab'

/**
 * The history entry filed before `report`. Entries arrive newest first in the
 * server's order (snapshot time, ties broken by id), so a report that is in
 * the list takes the next entry by position — the same neighbour the company
 * page shows below it, even for two filings stamped the same instant.
 *
 * A report the history leaves out (withdrawn, or with no counts) has no
 * position, so it falls back to the latest entry dated before it. That
 * compares against `report.createdAt`, which for a portal report is when the
 * draft was opened — close enough for a report that is not itself listed.
 */
const findPreviousEntry = (
  entries: EmployeeCountHistoryEntryDto[],
  report: ReportDetailDto,
): EmployeeCountHistoryEntryDto | null => {
  const index = entries.findIndex((entry) => entry.reportId === report.id)
  if (index >= 0) return entries[index + 1] ?? null
  return (
    entries.find(
      (entry) => new Date(entry.submittedAt) < new Date(report.createdAt),
    ) ?? null
  )
}

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

  // Viðbótarlaun / aukagreiðslur per gender. Its own endpoint rather than part
  // of the chart payload because these are monthly krónur, not rates — see
  // PayComponentsTable.
  const { data: componentsData } = useQuery({
    ...trpc.reportStatistics.benefitsBreakdown.queryOptions({
      reportId: report.id,
    }),
    enabled: isSalary,
  })

  // The same endpoint the company page's history table reads, so "the
  // submission before this one" cannot differ between the two screens.
  const { data: employeeCountHistory, isError: employeeCountHistoryError } =
    useQuery(
      trpc.reports.employeeCountHistory.queryOptions({
        companyId: report.company.companyId,
      }),
    )
  const previousEmployeeCount = employeeCountHistory
    ? findPreviousEntry(employeeCountHistory.entries, report)
    : undefined

  const jafnrettisaetlun = {
    id: 'jafnrettisaetlun',
    label: reportText.tabEquality,
    content: (
      <EqualityReportTab
        report={report.equalityReport}
        supervisor={report.contactName ?? undefined}
        source={report.equalitySource}
        legacyValidUntil={report.equalityLegacyValidUntil}
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
          jobTitle: report.companyAdminTitle ?? undefined,
          gender: report.companyAdminGender ?? undefined,
        }}
        contactPerson={{
          email: report.contactEmail ?? undefined,
          name: report.contactName ?? undefined,
          jobTitle: report.contactTitle ?? undefined,
          phone: report.contactPhone ?? undefined,
        }}
        employees={{
          womenCount: report.averageEmployeeFemaleCount ?? undefined,
          menCount: report.averageEmployeeMaleCount ?? undefined,
          otherCount: report.averageEmployeeNeutralCount ?? undefined,
        }}
        previousEmployeeCount={previousEmployeeCount}
        previousEmployeeCountError={employeeCountHistoryError}
        // Only when the company page will actually show the section.
        employeeCountHistoryHref={
          employeeCountHistory?.entries.length
            ? `${NAV_PATHS.fyrirtaeki.href}/${report.company.companyId}#${EMPLOYEE_COUNT_HISTORY_ANCHOR}`
            : undefined
        }
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
                decomposition={report.result?.wageGapDecomposition}
                // Derived on read from the same frozen snapshot, not stored.
                payDispersion={report.result?.payDispersion}
                payComponents={componentsData}
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
                salaryDataBasis={report.salaryDataBasis}
                salaryDataPeriod={report.salaryDataPeriod}
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
