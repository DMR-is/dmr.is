import debounce from 'lodash/debounce'
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'next-usequerystate'

import {
  Box,
  Button,
  Inline,
  Input,
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

  const [_, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const allFilters = [
    ...((enableDepartments && departments) || []),
    ...((enableTypes && types) || []),
    ...((enableCategories && categories) || []),
  ]

  const resetFilters = () => {
    setSearch('')

    enableCategories && setCategories([])
    enableDepartments && setDepartments([])
    enableTypes && setTypes([])
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
              {enableTypes && <TypesFilter />}
              {enableDepartments && <DepartmentsFilter />}
              {enableCategories && <CategoriesFilter />}
            </FilterPopover>
          </Popover>
        )}
      </Box>
      {allFilters.length > 0 && (
        <Stack space={1}>
          <Inline space={1} flexWrap="wrap">
            <Text whiteSpace="nowrap">Síun á lista:</Text>
            {enableDepartments &&
              departments?.map((dep, i) => {
                return (
                  <ActiveFilterTag
                    key={i}
                    label={dep}
                    onClick={() => {
                      setPage(1)
                      setDepartments(departments.filter((d) => d !== dep))
                    }}
                  />
                )
              })}
            {enableTypes &&
              types?.map((dep, i) => (
                <ActiveFilterTag
                  key={i}
                  label={dep}
                  variant="purple"
                  onClick={() => {
                    setPage(1)
                    setTypes(types.filter((d) => d !== dep))
                  }}
                />
              ))}
            {enableCategories &&
              categories?.map((dep, i) => (
                <ActiveFilterTag
                  key={i}
                  label={dep}
                  variant="mint"
                  onClick={() => {
                    setPage(1)
                    setCategories(categories.filter((d) => d !== dep))
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
                  setPage(1)
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
