'use client'

import { useMemo } from 'react'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import {
  type CompanySizeEnum,
  type EmployeeCountHistoryEntryDto,
  ReportTypeEnum,
} from '../../../../gen/fetch'
import { reportText, sharedText } from '../../../../lib/text'
import {
  COMPANY_SIZE_LABEL,
  formatEmployeeCount,
  formatEmployeeDelta,
  formatNationalId,
  formatTimestampDate,
  mapGender,
} from '../../../../lib/utils'
import { InfoItems } from './InfoItems'

import { type ColumnDef } from '@tanstack/react-table'

const c = reportText.companyTab
const d = reportText.detailFields
const f = sharedText.form

type Subsidary = {
  name?: string
  nationalId?: string
}

const subsidariesColumns: ColumnDef<Subsidary>[] = [
  {
    accessorKey: 'name',
    header: f.nameLabel,
    cell: ({ getValue }) => getValue<string>() ?? sharedText.unknown,
  },
  {
    accessorKey: 'nationalId',
    header: f.kennitalaLabel,
    cell: ({ getValue }) => {
      const val = getValue<string | undefined>()
      return val ? formatNationalId(val) : sharedText.unknown
    },
  },
]

/**
 * A figure with its change since the previous submission beside it. Without a
 * previous figure to compare against it is just the figure.
 */
const CountWithChange = ({
  current,
  previous,
}: {
  current?: number
  previous?: number | null
}) => {
  // InfoItems renders an element as-is, so the unknown fallback is ours.
  if (current === undefined) return <Text>{sharedText.unknown}</Text>
  return (
    <Text>
      {formatEmployeeCount(current)}
      {previous !== undefined && previous !== null && (
        <Text as="span" variant="small" color="dark300">
          {' '}
          ({formatEmployeeDelta(current - previous)} {c.sincePrevious})
        </Text>
      )}
    </Text>
  )
}

interface CompanyInfoTabProps {
  company?: {
    name?: string
    nationalId?: string
    address?: string
    city?: string
    employeeCountCategory?: CompanySizeEnum
    isatCategory?: string
  }
  admin?: {
    name?: string
    jobTitle?: string
    email?: string
    gender?: string
  }
  contactPerson?: {
    name?: string
    jobTitle?: string
    email?: string
    phone?: string
  }
  employees?: {
    womenCount?: number
    menCount?: number
    otherCount?: number
  }
  subsidaries?: Subsidary[]
  /**
   * The company's submission before this one. `undefined` while it loads,
   * `null` when there is none.
   */
  previousEmployeeCount?: EmployeeCountHistoryEntryDto | null
  employeeCountHistoryHref?: string
}

export const CompanyInfoTab = ({
  company,
  admin,
  contactPerson,
  employees,
  subsidaries,
  previousEmployeeCount,
  employeeCountHistoryHref,
}: CompanyInfoTabProps) => {
  const subsidariesData = useMemo(() => subsidaries ?? [], [subsidaries])

  const hasCounts =
    employees?.womenCount !== undefined ||
    employees?.menCount !== undefined ||
    employees?.otherCount !== undefined
  const totalCount = hasCounts
    ? (employees?.womenCount ?? 0) +
      (employees?.menCount ?? 0) +
      (employees?.otherCount ?? 0)
    : undefined
  const previous = previousEmployeeCount ?? undefined

  return (
    <Box marginBottom={6} marginTop={4}>
      <Accordion singleExpand={false} dividerOnTop={false} space={'p5'}>
        <AccordionItem
          id="company-name"
          label={c.companyInfoHeading}
          startExpanded
        >
          <InfoItems
            items={[
              { label: f.companyHeading, children: company?.name },
              {
                label: f.kennitalaLabel,
                children: formatNationalId(company?.nationalId),
              },
              { label: d.address, children: company?.address },
              { label: d.city, children: company?.city },
              {
                label: d.employeeCount,
                children: company?.employeeCountCategory
                  ? COMPANY_SIZE_LABEL[company.employeeCountCategory]
                  : undefined,
              },
              {
                label: d.isatCode,
                children: company?.isatCategory,
              },
            ]}
          />
        </AccordionItem>
        <AccordionItem id="company-admin" label={f.topManagerHeading}>
          <InfoItems
            items={[
              { label: f.nameLabel, children: admin?.name },
              { label: f.jobTitleLabel, children: admin?.jobTitle },
              { label: f.emailLabel, children: admin?.email },
              { label: f.genderLabel, children: mapGender(admin?.gender) },
            ]}
          />
        </AccordionItem>
        <AccordionItem id="company-contact-person" label={f.contactHeading}>
          <InfoItems
            items={[
              { label: f.nameLabel, children: contactPerson?.name },
              { label: f.jobTitleLabel, children: contactPerson?.jobTitle },
              { label: f.emailLabel, children: contactPerson?.email },
              { label: f.phoneShortLabel, children: contactPerson?.phone },
            ]}
          />
        </AccordionItem>
        <AccordionItem
          id="company-average-employees"
          label={c.averageEmployeesHeading}
        >
          <InfoItems
            colCount={4}
            items={[
              {
                label: sharedText.genders.femaleCount,
                children: (
                  <CountWithChange
                    current={employees?.womenCount}
                    previous={previous?.femaleCount}
                  />
                ),
              },
              {
                label: sharedText.genders.maleCount,
                children: (
                  <CountWithChange
                    current={employees?.menCount}
                    previous={previous?.maleCount}
                  />
                ),
              },
              {
                label: c.genderNeutralRegistry,
                children: (
                  <CountWithChange
                    current={employees?.otherCount}
                    previous={previous?.neutralCount}
                  />
                ),
              },
              {
                label: c.totalCount,
                children: (
                  <CountWithChange
                    current={totalCount}
                    previous={previous?.totalCount}
                  />
                ),
              },
            ]}
          />
          {previousEmployeeCount !== undefined && (
            <Box marginTop={1}>
              <Text variant="small">
                {previousEmployeeCount
                  ? c.comparedWith(
                      previousEmployeeCount.type === ReportTypeEnum.SALARY
                        ? sharedText.typeLabels.SALARY
                        : sharedText.typeLabels.EQUALITY,
                      formatTimestampDate(previousEmployeeCount.submittedAt),
                    )
                  : c.noPrevious}
              </Text>
              {employeeCountHistoryHref && (
                <Box marginTop={2}>
                  {/* The anchor navigates and takes focus; the button is only
                      the app's text-link styling, so it stays out of the tab
                      order rather than being a second stop. */}
                  <LinkV2 href={employeeCountHistoryHref}>
                    <Button
                      variant="text"
                      size="small"
                      icon="arrowForward"
                      unfocusable
                    >
                      {c.viewHistory}
                    </Button>
                  </LinkV2>
                </Box>
              )}
            </Box>
          )}
        </AccordionItem>
        {subsidariesData.length > 0 && (
          <AccordionItem id="company-subsidaries" label={c.subsidaries}>
            <Table columns={subsidariesColumns} data={subsidariesData} />
          </AccordionItem>
        )}
      </Accordion>
    </Box>
  )
}
