import { Popover, PopoverDisclosure, usePopoverState } from 'reakit/Popover'

import { Accordion } from '@island.is/island-ui/core/Accordion/Accordion'
import { AccordionItem } from '@island.is/island-ui/core/Accordion/AccordionItem/AccordionItem'
import { Box } from '@island.is/island-ui/core/Box/Box'
import { Button } from '@island.is/island-ui/core/Button/Button'
import { Checkbox } from '@island.is/island-ui/core/Checkbox/Checkbox'
import { Inline } from '@island.is/island-ui/core/Inline/Inline'
import { Stack } from '@island.is/island-ui/core/Stack/Stack'

import { useFilters } from '../../hooks/useFilters'
import { QueryParams } from '../../lib/constants'
import { OptionType, QueryFilterValue } from '../../lib/types'
import { isArrayOptionSelected, toggleArrayOption } from '../../lib/utils'
import * as styles from './FilterMenu.css'

export type FilterMenuToggleCallback<T> = ({
  param,
  option,
  value,
}: {
  param: QueryParams
  option: T
  value: boolean
}) => void

export type FilterMenuClearCallback = ({
  param,
}: {
  param: QueryParams
}) => void

export type FilterMenuItem<T> = {
  title: string
  queryParam: QueryParams
  options: OptionType<T>[]
}

export type FilterMenuProps<T> = {
  filters: FilterMenuItem<T>[]
}

export const FilterMenu = <T extends QueryFilterValue>({
  filters,
}: FilterMenuProps<T>) => {
  const { params, setParams } = useFilters()
  const popover = usePopoverState({
    placement: 'bottom-start',
  })

  return (
    <Box className={styles.filterMenu}>
      {filters.length > 0 && (
        <PopoverDisclosure as="div" role="button" {...popover}>
          <Button variant="utility" icon="filter" iconType="outline">
            Opna síu
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
                  startExpanded={i === 0}
                >
                  <Stack space={2}>
                    {filter.options.map((option, j) => {
                      const isChecked = isArrayOptionSelected(
                        params[filter.queryParam],
                        option.value,
                      )
                      return (
                        <Checkbox
                          checked={isChecked}
                          key={j}
                          label={option.label}
                          onChange={(e) => {
                            setParams({
                              [filter.queryParam]: toggleArrayOption(
                                params[filter.queryParam],
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
                        Hreinsa val
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
            onClick={() => setParams(null)}
            size="small"
            variant="text"
            icon="reload"
          >
            Hreinsa allar síur
          </Button>
        </Box>
      </Popover>
    </Box>
  )
}

export default FilterMenu
