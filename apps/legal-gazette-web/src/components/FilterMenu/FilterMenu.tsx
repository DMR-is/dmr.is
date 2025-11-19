'use client'

import { useIntl } from 'react-intl'
import { Popover, PopoverDisclosure, usePopoverState } from 'reakit'

import {
  Accordion,
  AccordionItem,
  Box,
  Button,
  Checkbox,
  Inline,
  Stack,
} from '@island.is/island-ui/core'

import { useFilterContext } from '../../hooks/useFilters'
import { QueryParams } from '../../lib/constants'
import { messages } from '../../lib/messages/messages'
import { OptionType } from '../../lib/types'
import { isArrayOptionSelected, toggleArrayOption } from '../../lib/utils'
import * as styles from './FilterMenu.css'

export type FilterMenuToggleCallback = ({
  param,
  option,
  value,
}: {
  param: QueryParams
  option: string
  value: boolean
}) => void

export type FilterMenuClearCallback = ({
  param,
}: {
  param: QueryParams
}) => void

export type FilterMenuItem = {
  title: string
  queryParam: QueryParams
  options?: OptionType<string>[]
}

export const FilterMenu = () => {
  const { formatMessage } = useIntl()
  const {
    params,
    setParams,
    typeOptions,
    categoryOptions,
    statusOptions,
    resetParams,
  } = useFilterContext()
  const popover = usePopoverState({
    placement: 'bottom-start',
  })

  const filters: FilterMenuItem[] = [
    {
      queryParam: QueryParams.TYPE,
      title: 'Tegund',
      options: typeOptions,
    },
    {
      queryParam: QueryParams.CATEGORY,
      title: 'Flokkur',
      options: categoryOptions,
    },
    {
      queryParam: QueryParams.STATUS,
      title: 'Staða',
      options: statusOptions,
    },
  ]

  return (
    <Box className={styles.filterMenu}>
      {filters.length > 0 && (
        <PopoverDisclosure as="div" role="button" {...popover}>
          <Button variant="utility" icon="filter" iconType="outline">
            {formatMessage(messages.openFilterMenu)}
          </Button>
        </PopoverDisclosure>
      )}
      <Popover {...popover}>
        <Box className={styles.filterMenuPopover} boxShadow="subtle">
          <Accordion
            dividers={true}
            dividerOnBottom={true}
            dividerOnTop={false}
            singleExpand={true}
          >
            {filters.map((filter, i) => (
              <Box padding={2} key={i}>
                <AccordionItem
                  labelVariant="h5"
                  iconVariant="small"
                  id={`accordion-filter-${i}`}
                  label={filter.title}
                  startExpanded={false}
                >
                  <Stack space={2}>
                    {filter.options?.map((option, j) => {
                      const isChecked = isArrayOptionSelected(
                        params[filter.queryParam as keyof typeof params] ??
                          null,
                        option.value,
                      )
                      return (
                        <Checkbox
                          id={`checkbox-filter-${filter.queryParam}-${j}`}
                          checked={isChecked}
                          key={j}
                          label={option.label}
                          onChange={(e) => {
                            setParams({
                              [filter.queryParam]: toggleArrayOption(
                                params[
                                  filter.queryParam as keyof typeof params
                                ] ?? null,
                                option.value,
                                e.target.checked,
                              ),
                            })
                          }}
                        />
                      )
                    })}
                    <Inline justifyContent="flexEnd">
                      <Button
                        icon="reload"
                        variant="text"
                        size="small"
                        onClick={() =>
                          setParams({
                            [filter.queryParam]: null,
                          })
                        }
                      >
                        {formatMessage(messages.clearFilter)}
                      </Button>
                    </Inline>
                  </Stack>
                </AccordionItem>
              </Box>
            ))}
          </Accordion>
        </Box>
        <Box className={styles.filterMenuClearButton}>
          <Button
            onClick={() => resetParams()}
            size="small"
            variant="text"
            icon="reload"
          >
            {formatMessage(messages.clearFilters)}
          </Button>
        </Box>
      </Popover>
    </Box>
  )
}

export default FilterMenu
