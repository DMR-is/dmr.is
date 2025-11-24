'use client'

import { useState } from 'react'

import { Box, GridColumn, GridRow } from '@dmr.is/ui/components/island-is'

import { SearchIssuesResults } from './results/SearchIssuesResults'
import { SearchIssuesSidebar } from './sidebar/SearchIssuesSidebar'

export const SearchIssuesPage = () => {
  const [totalItems, setTotalItems] = useState(0)
  return (
    <GridRow>
      <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
        <Box>
          <SearchIssuesSidebar totalItems={totalItems} />
        </Box>
      </GridColumn>
      <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
        <SearchIssuesResults setTotalItems={setTotalItems} />
      </GridColumn>
    </GridRow>
  )
}
