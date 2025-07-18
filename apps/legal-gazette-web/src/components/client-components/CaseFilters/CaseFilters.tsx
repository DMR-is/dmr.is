'use client'

import debounce from 'lodash/debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { ActiveFilters } from '@dmr.is/ui/components/ActiveFilters/ActiveFilters'

import { Inline, Input, Stack } from '@island.is/island-ui/core'

import { useFilters } from '../../../hooks/useFilters'
import { messages } from '../../../lib/messages/messages'
import { QueryFilterValue } from '../../../lib/types'
import { toggleArrayOption } from '../../../lib/utils'
import FilterMenu, { FilterMenuProps } from '../FilterMenu/FilterMenu'

type CaseFiltersProps = {
  filters: FilterMenuProps<QueryFilterValue>['filters']
}

export const CaseFilters = ({ filters }: CaseFiltersProps) => {
  const { params, setParams, activeFilters } = useFilters()
  const [localSearch, setLocalSearch] = useState(params.search)

  const { formatMessage } = useIntl()

  const handleSearch = useCallback(
    debounce((value: string) => {
      setParams({ search: value })
    }, 500),
    [],
  )

  // when all filters are cleared, clear the search
  useEffect(() => {
    if (params.search !== localSearch) {
      setLocalSearch(params.search)
    }
  }, [params.search])

  const activeFilterProps = useMemo(() => {
    return activeFilters
      .map((filter) => {
        const [queryParam, value] = filter

        const currentFilter = filters.find((f) => f.queryParam === queryParam)

        if (!currentFilter) {
          return null
        }

        const currentOptions =
          currentFilter?.options.filter((opt) =>
            value.includes(opt.value as string),
          ) || []

        if (currentOptions.length === 0) {
          return null
        }

        return {
          queryParam: queryParam,
          options: currentOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
          })),
        }
      })
      .filter((filter) => filter !== null)
  }, [activeFilters])

  return (
    <Stack space={2}>
      <Inline space={2}>
        <Input
          name="search"
          size="sm"
          backgroundColor="blue"
          placeholder={formatMessage(messages.search)}
          onChange={(e) => {
            setLocalSearch(e.target.value)
            handleSearch(e.target.value)
          }}
          value={localSearch}
          icon={{
            name: 'search',
            type: 'outline',
          }}
        />
        <FilterMenu filters={filters} />
      </Inline>
      <ActiveFilters
        onClearLabel={formatMessage(messages.clear)}
        onClear={() =>
          setParams(
            activeFilters.reduce((acc, [key]) => ({ ...acc, [key]: [] }), {}),
          )
        }
        filters={activeFilterProps.flatMap((af) =>
          af.options.map((opt) => ({
            label: opt.label,
            onClick: () => {
              setParams({
                [af.queryParam]: toggleArrayOption(
                  params[af.queryParam],
                  opt.value,
                  false,
                ),
              })
            },
          })),
        )}
      />
    </Stack>
  )
}

export default CaseFilters
