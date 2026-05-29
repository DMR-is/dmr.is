'use client'

import { type ChangeEvent, type ReactNode } from 'react'

import { Accordion } from '@island.is/island-ui/core/Accordion/Accordion'
import { AccordionItem } from '@island.is/island-ui/core/Accordion/AccordionItem/AccordionItem'
import { Box } from '@island.is/island-ui/core/Box/Box'
import { Button } from '@island.is/island-ui/core/Button/Button'
import { Checkbox } from '@island.is/island-ui/core/Checkbox/Checkbox'
import { RadioButton } from '@island.is/island-ui/core/RadioButton/RadioButton'
import { Inline } from '@island.is/island-ui/core/Inline/Inline'
import { Stack } from '@island.is/island-ui/core/Stack/Stack'

type FilterItem = {
  value: string
  label: string | ReactNode
}

type FilterCategory = {
  id: string
  label: string | ReactNode
  labelAs?: 'h2' | 'h3' | 'h4' | 'h5'
  selected: Array<string>
  filters: Array<FilterItem>
  inline?: boolean
  singleOption?: boolean
}

type FilterMultiChoiceChangeEvent = {
  categoryId: string
  selected: Array<string>
}

export interface FilterMultiChoiceProps {
  categories: ReadonlyArray<FilterCategory>
  labelClear: string
  singleExpand?: boolean
  onChange: (event: FilterMultiChoiceChangeEvent) => void
  onClear: (categoryId: string) => void
}

const CheckboxWrapper = ({
  inline = false,
  children,
}: {
  inline?: boolean
  children: ReactNode
}) =>
  inline ? (
    <Inline space={1} justifyContent="spaceBetween">
      {children}
    </Inline>
  ) : (
    <Stack space={2}>{children}</Stack>
  )

export const FilterMultiChoice = ({
  labelClear,
  categories,
  singleExpand,
  onChange,
  onClear,
}: FilterMultiChoiceProps) => {
  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
    category: FilterCategory,
    singleOption = false,
  ) => {
    if (event.target.checked) {
      singleOption
        ? (category.selected = [event.target.value])
        : category.selected.push(event.target.value)
    } else {
      category.selected.splice(category.selected.indexOf(event.target.value), 1)
    }
    onChange({ categoryId: category.id, selected: category.selected })
  }

  const renderFilters = (category: FilterCategory) =>
    category.filters.map((filter, index) =>
      category.singleOption ? (
        <RadioButton
          key={`${category.id}-${filter.value}-${index}`}
          name={`${category.id}-${filter.value}-${index}`}
          label={filter.label}
          value={filter.value}
          checked={category.selected.includes(filter.value)}
          onChange={(event) => handleChange(event, category, true)}
        />
      ) : (
        <Checkbox
          key={`${category.id}-${filter.value}-${index}`}
          name={`${category.id}-${filter.value}-${index}`}
          label={filter.label}
          value={filter.value}
          checked={category.selected.includes(filter.value)}
          onChange={(event) => handleChange(event, category)}
        />
      ),
    )

  return (
    <Box paddingX={3} paddingY={1} borderRadius="large" background="white">
      <Accordion
        space={3}
        dividerOnBottom={false}
        dividerOnTop={false}
        singleExpand={singleExpand}
      >
        {categories.map((category, index) => (
          <AccordionItem
            key={`${category.id}-${index}`}
            id={category.id}
            label={category.label}
            labelUse={category.labelAs || 'h5'}
            labelVariant="h5"
            labelColor={
              category.selected.length > 0 ? 'blue400' : 'currentColor'
            }
            iconVariant="small"
            startExpanded={category.selected.length > 0}
          >
            <Stack space={2}>
              <CheckboxWrapper inline={category.inline}>
                {renderFilters(category)}
              </CheckboxWrapper>
              {category.selected.length > 0 && (
                <Box textAlign="right">
                  <Button
                    icon="reload"
                    size="small"
                    variant="text"
                    onClick={() => onClear(category.id)}
                  >
                    {labelClear}
                  </Button>
                </Box>
              )}
            </Stack>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  )
}
