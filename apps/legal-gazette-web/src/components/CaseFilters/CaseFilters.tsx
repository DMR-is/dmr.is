import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import { Inline, Input } from '@island.is/island-ui/core'

import { useFilters } from '../../hooks/useFilters'
import { QueryParams } from '../../lib/constants'
import { toggleArrayOption } from '../../lib/utils'
import FilterMenu from '../FilterMenu/FilterMenu'

export const CaseFilters = () => {
  const { params, setParams } = useFilters()
  const { search, publication, type } = params

  const handleSearch = useCallback(
    debounce((value: string) => {
      setParams({ search: value })
    }, 500),
    [],
  )

  return (
    <Inline space={2}>
      <Input
        name="search"
        size="sm"
        backgroundColor="blue"
        placeholder="Sláðu inn leitarorð"
        defaultValue={search}
        onChange={(e) => handleSearch(e.target.value)}
        icon={{
          name: 'search',
          type: 'outline',
        }}
      />
      <FilterMenu
        onClearAll={() => setParams(null)}
        filters={[
          {
            title: 'Birting',
            queryParam: QueryParams.PUBLICATION,
            onToggle: ({ param, option, value }) => {
              setParams({
                [param]: toggleArrayOption(publication, option, value),
              })
            },
            onClear: ({ param }) => setParams({ [param]: null }),
            options: [
              {
                label: 'Mín mál',
                value: 'min-mal',
              },
              {
                label: 'Mál sem bíða svara',
                value: 'mal-sem-bida-svara',
              },
            ],
          },
          {
            title: 'Tegund',
            queryParam: QueryParams.TYPE,
            onToggle: ({ param, option, value }) =>
              setParams({ [param]: toggleArrayOption(type, option, value) }),
            onClear: ({ param }) => setParams({ [param]: null }),
            options: [
              {
                label: 'Lög',
                value: 'log',
              },
              {
                label: 'Reglugerð',
                value: 'reglugerd',
              },
              {
                label: 'Auglýsing',
                value: 'auglysing',
              },
              {
                label: 'Reglur',
                value: 'reglur',
              },
            ],
          },
        ]}
      />
    </Inline>
  )
}

export default CaseFilters
