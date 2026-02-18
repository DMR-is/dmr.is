'use client'

import { useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

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

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

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
    <Box className={styles.filterMenu} ref={containerRef}>
      {filters.length > 0 && (
        <div role="button" onClick={() => setIsOpen((prev) => !prev)}>
          <Button variant="utility" icon="filter" iconType="outline">
            {formatMessage(messages.openFilterMenu)}
          </Button>
        </div>
      )}
      {isOpen && (
        <div className={styles.filterMenuDropdown}>
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
        </div>
      )}
    </Box>
  )
}

export default FilterMenu
