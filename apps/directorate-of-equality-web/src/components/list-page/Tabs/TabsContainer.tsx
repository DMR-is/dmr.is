'use client'

import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { Tag, type TagVariant } from '@dmr.is/ui/components/island-is/Tag'

import { MOCK_DATA } from '../../../app/(protected)/mal/mocks'
import { type Case, COLUMN_EMPLOYEES, COLUMN_STATUS } from '../constants'
import { TabContent } from './TabContent'

import { type ColumnDef } from '@tanstack/react-table'

const STATUS_VARIANT: Record<string, TagVariant> = {
  Samþykkt: 'mint',
  Hafnað: 'red',
  Lokið: 'dark',
  'Í vinnslu': 'blue',
  'Bíður gagna': 'rose',
  'Til skoðunar': 'purple',
}

const statusColumn: ColumnDef<Case> = {
  ...COLUMN_STATUS,
  cell: ({ getValue }) => {
    const status = getValue<string>()
    if (!status) return null
    return (
      <Tag variant={STATUS_VARIANT[status] ?? 'blue'} disabled outlined>
        {status}
      </Tag>
    )
  },
}

const iVinnsluData = MOCK_DATA.slice(0, 5)
const afgreittData = MOCK_DATA.slice(0, 3)

export const TabsContainer = () => {
  return (
    <GridContainer>
      <Tabs
        label="Mál"
        selected="innsendingar"
        contentBackground="blue100"
        size="sm"
        tabs={[
          {
            id: 'innsendingar',
            label: `Innsendingar (${MOCK_DATA.length})`,
            content: <TabContent initialData={MOCK_DATA} />,
          },
          {
            id: 'i-vinnslu',
            label: `Í vinnslu (${iVinnsluData.length})`,
            content: (
              <TabContent
                initialData={iVinnsluData}
                extraColumns={[statusColumn, COLUMN_EMPLOYEES]}
              />
            ),
          },
          {
            id: 'afgreitt',
            label: `Afgreitt (${afgreittData.length})`,
            content: (
              <TabContent
                initialData={afgreittData}
                extraColumns={[COLUMN_EMPLOYEES]}
              />
            ),
          },
        ]}
      />
    </GridContainer>
  )
}
