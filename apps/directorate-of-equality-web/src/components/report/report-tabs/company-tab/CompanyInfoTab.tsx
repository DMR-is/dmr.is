'use client'

import { useMemo } from 'react'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { formatNationalId } from '../../../../lib/utils'
import { InfoItems } from './InfoItems'

import { type ColumnDef } from '@tanstack/react-table'

type Subsidary = {
  name?: string
  nationalId?: string
}

const subsidariesColumns: ColumnDef<Subsidary>[] = [
  {
    accessorKey: 'name',
    header: 'Nafn',
    cell: ({ getValue }) => getValue<string>() ?? 'Óþekkt',
  },
  {
    accessorKey: 'nationalId',
    header: 'Kennitala',
    cell: ({ getValue }) => {
      const val = getValue<string | undefined>()
      return val ? formatNationalId(val) : 'Óþekkt'
    },
  },
]

interface CompanyInfoTabProps {
  company?: {
    name?: string
    nationalId?: string
    address?: string
    city?: string
    averageEmployeeCountFromRsk?: number
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
          label="Upplýsingar fyrirtækis"
          startExpanded
        >
          <InfoItems
            items={[
              { label: 'Fyrirtæki', children: company?.name },
              {
                label: 'Kennitala',
                children: formatNationalId(company?.nationalId),
              },
              { label: 'Heimilisfang', children: company?.address },
              { label: 'Sveitarfélag', children: company?.city },
              {
                label: 'Fjöldi starfsmanna',
                children: company?.averageEmployeeCountFromRsk,
              },
              {
                label: 'ÍSAT atvinnugreinaflokkun',
                children: company?.isatCategory,
              },
            ]}
          />
        </AccordionItem>
        <AccordionItem id="company-admin" label="Æðsti stjórnandi">
          <InfoItems
            items={[
              { label: 'Nafn', children: admin?.name },
              { label: 'Netfang', children: admin?.email },
              { label: 'Kyn', children: admin?.gender },
            ]}
          />
        </AccordionItem>
        <AccordionItem id="company-contact-person" label="Tengiliður">
          <InfoItems
            items={[
              { label: 'Nafn', children: contactPerson?.name },
              { label: 'Netfang', children: contactPerson?.email },
              { label: 'Sími', children: contactPerson?.phone },
            ]}
          />
        </AccordionItem>
        <AccordionItem
          id="company-average-employees"
          label="Meðalfjöldi starfsmanna"
        >
          <InfoItems
            colCount={3}
            items={[
              { label: 'Konur', children: employees?.womenCount },
              { label: 'Karlar', children: employees?.menCount },
              {
                label: 'Hlutlaus skráning kyns í Þjóðskrá',
                children: employees?.otherCount,
              },
            ]}
          />
        </AccordionItem>
        {subsidariesData.length > 0 && (
          <AccordionItem id="company-subsidaries" label="Dótturfélög">
            <Table columns={subsidariesColumns} data={subsidariesData} />
          </AccordionItem>
        )}
      </Accordion>
    </Box>
  )
}
