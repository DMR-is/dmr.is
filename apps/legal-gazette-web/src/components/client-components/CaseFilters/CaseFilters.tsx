'use client'

import debounce from 'lodash/debounce'
import { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { ActiveFilters } from '@dmr.is/ui/components/ActiveFilters/ActiveFilters'

import { Inline, Input, Stack } from '@island.is/island-ui/core'

import { useFilterContext } from '../../../hooks/useFilters'
import { messages } from '../../../lib/messages/messages'
import FilterMenu from '../FilterMenu/FilterMenu'

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
