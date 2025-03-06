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

import { useFilters } from '../../hooks/useFilters'
import { QueryParams } from '../../lib/constants'
import { OptionType } from '../../lib/types'
import { isOptionSelected } from '../../lib/utils'
import * as styles from './FilterMenu.css'

type FilterMenuToggleCallback<T> = ({
  param,
  option,
  value,
}: {
  param: QueryParams
  option: T
  value: boolean
}) => void

type FilterMenuClearCallback = ({ param }: { param: QueryParams }) => void

type FilterMenuItem<T> = {
  title: string
  queryParam: QueryParams
  options: OptionType<T>[]
  onToggle?: FilterMenuToggleCallback<T>
  onClear?: FilterMenuClearCallback
}

type FilterMenuProps<T> = {
  filters: FilterMenuItem<T>[]
  onClearAll?: () => void
}

export const FilterMenu = <T,>({ filters, onClearAll }: FilterMenuProps<T>) => {
  const { params } = useFilters()
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
                      const isChecked = isOptionSelected(
                        params[filter.queryParam],
                        option.value,
                      )
                      return (
                        <Checkbox
                          checked={isChecked}
                          key={j}
                          label={option.label}
                          onChange={(e) => {
                            if (!filter.onToggle) return
                            filter.onToggle({
                              option: option.value,
                              param: filter.queryParam,
                              value: e.target.checked,
                            })
                          }}
                        />
                      )
                    })}
                    {filter.onClear && (
                      <Inline justifyContent="flexEnd">
                        <Button
                          icon="reload"
                          variant="text"
                          size="small"
                          onClick={() =>
                            filter.onClear?.({ param: filter.queryParam })
                          }
                        >
                          Hreinsa val
                        </Button>
                      </Inline>
                    )}
                  </Stack>
                </AccordionItem>
              </Box>
            ))}
          </Accordion>
        </Box>
        <Box className={styles.filterMenuClearButton}>
          <Button
            onClick={onClearAll}
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
