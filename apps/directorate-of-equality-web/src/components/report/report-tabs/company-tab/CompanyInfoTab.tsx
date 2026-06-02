'use client'

import { useMemo } from 'react'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { type CompanySizeEnum } from '../../../../gen/fetch'
import { reportText, sharedText } from '../../../../lib/text'
import {
  COMPANY_SIZE_LABEL,
  formatNationalId,
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
    email?: string
    gender?: string
  }
  contactPerson?: {
    name?: string
    email?: string
    phone?: string
  }
  employees?: {
    womenCount?: number
    menCount?: number
    otherCount?: number
  }
  subsidaries?: Subsidary[]
}

export const CompanyInfoTab = ({
  company,
  admin,
  contactPerson,
  employees,
  subsidaries,
}: CompanyInfoTabProps) => {
  const subsidariesData = useMemo(() => subsidaries ?? [], [subsidaries])

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
              { label: f.emailLabel, children: admin?.email },
              { label: f.genderLabel, children: mapGender(admin?.gender) },
            ]}
          />
        </AccordionItem>
        <AccordionItem id="company-contact-person" label={f.contactHeading}>
          <InfoItems
            items={[
              { label: f.nameLabel, children: contactPerson?.name },
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
            colCount={3}
            items={[
              {
                label: sharedText.genders.femaleCount,
                children: employees?.womenCount,
              },
              {
                label: sharedText.genders.maleCount,
                children: employees?.menCount,
              },
              {
                label: c.genderNeutralRegistry,
                children: employees?.otherCount,
              },
            ]}
          />
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
