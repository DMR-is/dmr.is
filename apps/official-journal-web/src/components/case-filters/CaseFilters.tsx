import debounce from 'lodash/debounce'
import { ChangeEvent, useCallback } from 'react'

import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { CaseStatusEnum } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { FilterPopover } from '../filter-popover/FilterPopover'
import { Popover } from '../popover/Popover'
import { ActiveFilterTag } from './ActiveFilterTag'
import * as styles from './CaseFilters.css'
import { CategoriesFilter } from './CategoriesFilter'
import { DepartmentsFilter } from './DepartmentsFilter'
import { messages } from './messages'
import { StatusFilter } from './StatusFilter'
import { TypesFilter } from './TypesFilter'

type Props = {
  enableCategories: boolean
  enableDepartments: boolean
  enableTypes: boolean
  enableSearch?: boolean
  statuses?: CaseStatusEnum[]
}

export const CaseFilters = ({
  enableCategories,
  enableDepartments,
  enableTypes,
  statuses,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const { params, setParams, resetFilters } = useFilters()
  const enableStatus = statuses && statuses.length > 0

  const allFilters = [
    ...((enableDepartments && params.department) || []),
    ...((enableTypes && params.type) || []),
    ...((enableCategories && params.category) || []),
    ...((enableStatus && params.status) || []),
  ]

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    e.persist()
    const value = e.target.value
    setParams({ search: value })
  }

  const debouncedHandleChange = useCallback(debounce(handleChange, 500), [])
  const showFilters =
    enableCategories || enableDepartments || enableTypes || enableStatus

  return (
    <Stack space={[2, 2, 3]}>
      <Box className={styles.caseFilters}>
        <Input
          size="sm"
          icon={{ name: 'search', type: 'outline' }}
          backgroundColor="blue"
          name="filter"
          defaultValue={params.search ?? undefined}
          onChange={debouncedHandleChange}
          placeholder={formatMessage(messages.general.searchPlaceholder)}
        />
        {showFilters && (
          <Popover
            label={formatMessage(messages.general.filters)}
            disclosure={
              <Button variant="utility" icon="filter">
                {formatMessage(messages.general.openFilter)}
              </Button>
            }
          >
            <FilterPopover resetFilters={resetFilters}>
              {enableTypes && <TypesFilter />}
              {enableDepartments && <DepartmentsFilter />}
              {enableCategories && <CategoriesFilter />}
              {enableStatus && <StatusFilter statuses={statuses} />}
            </FilterPopover>
          </Popover>
        )}
      </Box>
      {allFilters.length > 0 && (
        <Stack space={1}>
          <Inline space={1} flexWrap="wrap">
            <Text whiteSpace="nowrap">Síun á lista:</Text>
            {enableDepartments &&
              params.department?.map((dep, i) => {
                return (
                  <ActiveFilterTag
                    key={i}
                    label={dep}
                    onClick={() => {
                      setParams({
                        department: params.department.filter((d) => d !== dep),
                      })
                    }}
                  />
                )
              })}
            {enableTypes &&
              params.type?.map((dep, i) => (
                <ActiveFilterTag
                  key={i}
                  label={dep}
                  variant="purple"
                  onClick={() => {
                    setParams({ type: params.type.filter((d) => d !== dep) })
                  }}
                />
              ))}
            {enableCategories &&
              params.category?.map((dep, i) => (
                <ActiveFilterTag
                  key={i}
                  label={dep}
                  variant="mint"
                  onClick={() => {
                    setParams({
                      category: params.category.filter((d) => d !== dep),
                    })
                  }}
                />
              ))}
            {enableStatus &&
              params.status?.map((dep, i) => (
                <ActiveFilterTag
                  key={i}
                  label={dep}
                  variant="blueberry"
                  onClick={() => {
                    setParams({
                      status: params.status.filter((d) => d !== dep),
                    })
                  }}
                />
              ))}
          </Inline>
          {allFilters.length > 1 && (
            <Text whiteSpace="nowrap">
              <Button
                variant="text"
                size="small"
                icon="reload"
                onClick={() => {
                  resetFilters()
                }}
              >
                Hreinsa allar síur
              </Button>
            </Text>
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default CaseFilters
