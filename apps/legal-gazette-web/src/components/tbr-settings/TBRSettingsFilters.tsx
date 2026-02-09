'use client'

import debounce from 'lodash/debounce'
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs'
import { useCallback } from 'react'

import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Select } from '@dmr.is/ui/components/island-is/Select'

import * as styles from './TBRSettingsFilters.css'

export const TBRSettingsFilters = () => {
  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    activeOnly: parseAsBoolean.withDefault(false),
  })

  const updateSearch = useCallback(
    debounce((value: string) => {
      setQueryParams({ search: value, page: 1 })
    }, 300),
    [setQueryParams],
  )

  const onSearch = (value: string) => {
    updateSearch.cancel()
    updateSearch(value)
  }

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '4/12']}>
          <Input
            name="search"
            label="Leitarorð"
            placeholder="Leitaðu eftir nafni, kt., netfangi eða símanúmeri"
            size="sm"
            defaultValue={queryParams.search}
            icon={{ name: 'search', type: 'outline' }}
            onChange={(e) => onSearch(e.target.value)}
          />
        </GridColumn>
        <GridColumn
          className={styles.tbrSettingsCheckboxStyles}
          span={['12/12', '4/12']}
        >
          <Checkbox
            id="only-active"
            name="only-active"
            label="Aðeins virkir notendur"
            checked={queryParams.activeOnly}
            onChange={(e) =>
              setQueryParams({ activeOnly: e.target.checked, page: 1 })
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '4/12']}>
          <Select
            label="Fjöldi færslna á síðu"
            size="sm"
            value={{
              label: `${queryParams.pageSize} færslur`,
              value: queryParams.pageSize,
            }}
            onChange={(opt) => {
              return setQueryParams({
                pageSize: opt ? opt.value : 10,
                page: 1,
              })
            }}
            options={Array.from({ length: 5 }, (_, i) => (i + 1) * 10).map(
              (size) => ({
                label: `${size} færslur`,
                value: size,
              }),
            )}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
