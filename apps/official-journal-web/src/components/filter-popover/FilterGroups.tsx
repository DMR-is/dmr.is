import { Box, Text, Checkbox, Icon, Button } from '@island.is/island-ui/core'
import * as styles from './FilterPopover.css'
import { useId, useState } from 'react'
import { FilterOption } from '../../context/filterContext'
import { useFilterContext } from '../../hooks/useFilterContext'
import { messages } from '../../lib/messages'

type FilterPopoverProps = {
  title: string
  expanded?: boolean
  filters: FilterOption[]
  selectedFilters: FilterOption[]
  setFilters: (filters: FilterOption[]) => void
}

export const FilterGroup = ({
  title,
  expanded,
  filters,
  selectedFilters,
  setFilters,
}: FilterPopoverProps) => {
  const [localToggle, setLocalToggle] = useState(expanded)

  const localId = useId()

  return (
    <Box className={styles.filterExpandButtonWrapper}>
      <button
        aria-expanded={localToggle ? 'true' : 'false'}
        aria-controls={localId}
        onClick={() => setLocalToggle(!localToggle)}
        className={styles.filterExpandButton}
      >
        <Text color="dark400" variant="h5">
          {title}
        </Text>
        <Box className={styles.filterExpandButtonIcon}>
          <Icon
            icon={localToggle ? 'remove' : 'add'}
            color="blue400"
            size="small"
          />
        </Box>
      </button>
      <Box
        id={localId}
        className={styles.filterGroup({ expanded: localToggle })}
      >
        {filters.map((filter, i) => (
          <Checkbox
            name={filter.label}
            key={i}
            label={filter.label}
            onChange={(e) =>
              setFilters(
                e.target.checked
                  ? [...selectedFilters, filter]
                  : selectedFilters.filter((f) => f.value !== filter.value),
              )
            }
            checked={
              selectedFilters.find((f) => f.value === filter.value)
                ? true
                : false
            }
          />
        ))}
        <Box display="flex" justifyContent="flexEnd">
          <Button
            size="small"
            variant="text"
            icon="reload"
            onClick={() => setFilters([])}
            iconType="outline"
          >
            {messages.general.clear_filter}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export const FilterGroups = () => {
  const context = useFilterContext()

  // Options will be fetched from the backend
  // hardcoded for now
  return (
    <>
      <FilterGroup
        filters={[
          { label: 'Mín mál', value: 'my-cases' },
          { label: 'Mál í hraðbirtingu', value: 'fasttrack' },
          { label: 'Mál sem bíða svara', value: 'waiting' },
        ]}
        title="Birting"
        expanded={true}
        selectedFilters={context.publishingFilterOptions}
        setFilters={context.setPublishingFilterOptions}
      />
      <FilterGroup
        filters={[
          { label: 'Auglýsing', value: 'advert' },
          { label: 'Reglugerð', value: 'reglugerd' },
        ]}
        title="Tegund"
        expanded={false}
        selectedFilters={context.typeFilterOptions}
        setFilters={context.setTypeFilterOptions}
      />
      <FilterGroup
        filters={[
          { label: 'A-deild', value: 'a' },
          { label: 'B-deild', value: 'b' },
          { label: 'C-deild', value: 'c' },
        ]}
        title="Deildir"
        expanded={false}
        selectedFilters={context.departmentFilterOptions}
        setFilters={context.setDepartmentFilterOptions}
      />
      <FilterGroup
        filters={[
          { label: 'Innsent', value: 'submitted' },
          { label: 'Í vinnslu', value: 'in-progress' },
          { label: 'Tilbúið', value: 'ready' },
        ]}
        title="Flokkur"
        expanded={false}
        selectedFilters={context.categoriesFilterOptions}
        setFilters={context.setCategoriesFilterOptions}
      />
    </>
  )
}
