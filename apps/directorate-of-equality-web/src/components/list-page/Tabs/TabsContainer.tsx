'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import {
  Case,
  COLUMNS,
  DETAIL_FIELDS,
  MOCK_DATA,
} from '../../../app/(protected)/mal/mocks'
import { CaseFilter, CaseFilterState } from './CaseFilter'

const ExpandedRow = ({ row }: { row: Case }) => (
  <Box background="blue100" padding={2}>
    <Box display="flex" flexWrap="wrap" style={{ columnGap: 16 }}>
      {DETAIL_FIELDS.map(({ label, key }, index) => (
        <Box
          key={key}
          background={Math.floor(index / 2) % 2 === 0 ? 'white' : 'blue100'}
          paddingX={1}
          paddingY={1}
          style={{ flex: '0 0 calc(50% - 8px)' }}
        >
          <Box display="flex">
            <Box style={{ minWidth: 220 }}>
              <Text variant="small" fontWeight="semiBold">
                {label}
              </Text>
            </Box>
            <Text variant="small">{String(row[key])}</Text>
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)

const applyFilter = (data: Case[], filter: CaseFilterState): Case[] =>
  data.filter((row) => {
    if (filter.query) {
      const q = filter.query.toLowerCase()
      const searchable = Object.values(row).join(' ').toLowerCase()
      if (!searchable.includes(q)) return false
    }
    if (filter.category?.length && !filter.category.includes(row.category))
      return false
    if (filter.ceoGender?.length && !filter.ceoGender.includes(row.ceoGender))
      return false
    return true
  })

type TabContentProps = {
  initialData: Case[]
}

const TabContent = ({ initialData }: TabContentProps) => {
  const [filterState, setFilterState] = useState<CaseFilterState>({})

  const handleChange = (key: keyof CaseFilterState, values?: string[]) => {
    setFilterState((prev) => ({ ...prev, [key]: values }))
  }

  const handleQueryChange = (value: string) => {
    setFilterState((prev) => ({ ...prev, query: value || undefined }))
  }

  const handleReset = () => setFilterState({})

  const filtered = applyFilter(initialData, filterState)

  return (
    <Box marginTop={3}>
      <GridRow>
        <GridColumn span={['12/12', '3/12']}>
          <CaseFilter
            filterState={filterState}
            onChange={handleChange}
            onQueryChange={handleQueryChange}
            onReset={handleReset}
          />
        </GridColumn>
        <GridColumn span={['12/12', '9/12']}>
          <Stack space={3}>
            <Inline space={1} alignY="center">
              <Text fontWeight="semiBold">{filtered.length}</Text>
              <Text>færslur fundust</Text>
            </Inline>
            <Table
              columns={COLUMNS}
              data={filtered}
              getRowExpanded={(row) => <ExpandedRow row={row} />}
              paging={{
                page: 1,
                pageSize: 10,
                totalItems: filtered.length,
                totalPages: 1,
              }}
              showPageSizeSelect={false}
            />
          </Stack>
        </GridColumn>
      </GridRow>
    </Box>
  )
}

export const TabsContainer = () => {
  return (
    <GridContainer>
      <Tabs
        label="Mál"
        selected="innsendingar"
        contentBackground="blue100"
        tabs={[
          {
            id: 'innsendingar',
            label: `Innsendingar (${MOCK_DATA.length})`,
            content: <TabContent initialData={MOCK_DATA} />,
          },
          {
            id: 'i-vinnslu',
            label: 'Í vinnslu (5)',
            content: <TabContent initialData={MOCK_DATA.slice(0, 5)} />,
          },
          {
            id: 'afgreitt',
            label: 'Afgreitt (3)',
            content: <TabContent initialData={MOCK_DATA.slice(0, 3)} />,
          },
        ]}
      />
    </GridContainer>
  )
}
