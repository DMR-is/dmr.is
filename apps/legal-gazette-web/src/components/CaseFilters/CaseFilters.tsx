'use client'

import dynamic from 'next/dynamic'

import { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { ActiveFilters } from '@dmr.is/ui/components/ActiveFilters/ActiveFilters'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { debounce } from '@dmr.is/utils/shared/lodash/debounce'

import { useFilterContext } from '../../hooks/useFilters'
import { messages } from '../../lib/messages/messages'

const FilterMenu = dynamic(() => import('../FilterMenu/FilterMenu'), {
  ssr: false,
})

export const CaseFilters = () => {
  const { params, setParams, resetParams } = useFilterContext()
  const [localSearch, setLocalSearch] = useState(params.search)

  const { activeFilters } = useFilterContext()

  const { formatMessage } = useIntl()

  const handleSearch = useCallback(
    debounce((value: string) => {
      setParams({ search: value })
    }, 500),
    [],
  )
  return (
    <Stack space={[1, 2]}>
      <Inline alignY="center" space={2}>
        <Input
          size="sm"
          name="search"
          placeholder={formatMessage(messages.search)}
          backgroundColor="blue"
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value)
            handleSearch(e.target.value)
          }}
        />
        <FilterMenu />
      </Inline>
      <ActiveFilters
        onClear={resetParams}
        onClearLabel="Hreinsa síur"
        filters={activeFilters}
      />
    </Stack>
  )
}

export default CaseFilters
