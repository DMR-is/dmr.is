import { parseAsString, useQueryState } from 'next-usequerystate'

import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import {
  Box,
  Button,
  DatePicker,
  Inline,
  Input,
  LinkV2,
  Select,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { PageRoutes } from '../../lib/constants'

type SelectOption = {
  value: string
  label: string
}

type Props = {
  categoryOptions: SelectOption[]
  typeOptions: SelectOption[]
}

export const SearchSidebar = ({ categoryOptions, typeOptions }: Props) => {
  const [_searchTerm, setSearchTerm] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  )
  const [type, setType] = useQueryState('type', parseAsString)
  const [category, setCategory] = useQueryState('category', parseAsString)
  const [startDate, setStartDate] = useQueryState('startDate', parseAsString)
  const [endDate, setEndDate] = useQueryState('endDate', parseAsString)

  const clearFilters = () => {
    setSearchTerm('')
    setType('')
    setCategory('')
    setStartDate('')
    setEndDate('')
  }

  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setSearchTerm(value)
    }, 300),
    [setSearchTerm],
  )

  return (
    <Stack space={2}>
      <LinkV2 href={PageRoutes.FORSIDA}>
        <Button variant="text" size="small" preTextIcon="arrowBack">
          Til baka
        </Button>
      </LinkV2>
      <Box background="blue100" borderRadius="large">
        <Box padding={3} borderBottomWidth="standard" borderColor="blue200">
          <Stack space={2}>
            <Text variant="h5">Leit</Text>
            <Input
              max={255}
              name="search"
              placeholder="Leit í lögbirtingablaðinu"
              size="sm"
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            />
          </Stack>
        </Box>
        <Box padding={3}>
          <Stack space={2}>
            <Box marginBottom={1}>
              <Inline justifyContent="spaceBetween">
                <Text variant="h5">Síun</Text>
                <Button onClick={clearFilters} variant="text" size="small">
                  Hreinsa síu
                </Button>
              </Inline>
            </Box>
            <Select
              isClearable
              size="xs"
              label="Tegund"
              placeholder="Veldu tegund"
              backgroundColor="white"
              options={typeOptions}
              defaultValue={typeOptions.find((opt) => opt.value === type)}
              onChange={(opt) => {
                setType(opt?.value ? opt.value : null)
              }}
            />
            <Select
              isClearable
              placeholder="Veldu flokk"
              options={categoryOptions}
              defaultValue={categoryOptions.find(
                (opt) => opt.value === category,
              )}
              name="category"
              onChange={(opt) => {
                setCategory(opt?.value ? opt.value : null)
              }}
              size="xs"
              label="Flokkur"
              backgroundColor="white"
            />
            <DatePicker
              locale="is"
              size="xs"
              label="Dagsetning frá"
              placeholderText="Veldu dagsetningu"
              selected={startDate ? new Date(startDate) : null}
              handleChange={(date) =>
                setStartDate(date ? date.toISOString().split('T')[0] : '')
              }
            />
            <DatePicker
              locale="is"
              size="xs"
              label="Dagsetning til"
              placeholderText="Veldu dagsetningu"
              selected={endDate ? new Date(endDate) : null}
              handleChange={(date) =>
                setEndDate(date ? date.toISOString().split('T')[0] : '')
              }
            />
          </Stack>
        </Box>
      </Box>
    </Stack>
  )
}

export default SearchSidebar
