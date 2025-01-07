import debounce from 'lodash/debounce'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { Suspense } from 'react'

import {
  Box,
  Button,
  Inline,
  Input,
  SkeletonLoader,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { FilterPopover } from '../filter-popover/FilterPopover'
import { Popover } from '../popover/Popover'
import { ActiveFilterTag } from './ActiveFilterTag'
import * as styles from './CaseFilters.css'
import { CategoriesFilter } from './CategoriesFilter'
import { DepartmentsFilter } from './DepartmentsFilter'
import { messages } from './messages'
import { TypesFilter } from './TypesFilter'

type Props = {
  enableCategories: boolean
  enableDepartments: boolean
  enableTypes: boolean
}

export const CaseFilters = ({
  enableCategories,
  enableDepartments,
  enableTypes,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const [search, setSearch] = useQueryState('search')
  const [departments, setDepartments] = useQueryState(
    'department',
    parseAsArrayOf(parseAsString, ','),
  )
  const [categories, setCategories] = useQueryState(
    'category',
    parseAsArrayOf(parseAsString, ','),
  )
  const [types, setTypes] = useQueryState(
    'type',
    parseAsArrayOf(parseAsString, ','),
  )

  const allFilters = [
    ...(departments || []),
    ...(types || []),
    ...(categories || []),
  ]

  const resetFilters = () => {
    setSearch('')
    setCategories([])
    setDepartments([])
    setTypes([])
  }

  const showFilters = enableCategories || enableDepartments || enableTypes

  return (
    <Stack space={[2, 2, 3]}>
      <Box className={styles.caseFilters}>
        <Input
          size="sm"
          icon={{ name: 'search', type: 'outline' }}
          backgroundColor="blue"
          name="filter"
          defaultValue={search ?? undefined}
          onChange={(e) => debounce(() => setSearch(e.target.value), 500)}
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
              <Suspense
                fallback={
                  <SkeletonLoader
                    repeat={3}
                    space={2}
                    borderRadius="standard"
                    height={44}
                  />
                }
              >
                {enableTypes && <TypesFilter />}
                {enableDepartments && <DepartmentsFilter />}
                {enableCategories && <CategoriesFilter />}
              </Suspense>
            </FilterPopover>
          </Popover>
        )}
      </Box>
      {allFilters.length > 0 && (
        <Stack space={1}>
          <Inline space={1} flexWrap="wrap">
            <Text whiteSpace="nowrap">Síun á lista:</Text>
            {departments?.map((dep, i) => (
              <ActiveFilterTag
                key={i}
                label={dep}
                onClick={() =>
                  setDepartments(departments.filter((d) => d !== dep))
                }
              />
            ))}
            {types?.map((dep, i) => (
              <ActiveFilterTag
                key={i}
                label={dep}
                variant="purple"
                onClick={() => setTypes(types.filter((d) => d !== dep))}
              />
            ))}
            {categories?.map((dep, i) => (
              <ActiveFilterTag
                key={i}
                label={dep}
                variant="mint"
                onClick={() =>
                  setCategories(categories.filter((d) => d !== dep))
                }
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
