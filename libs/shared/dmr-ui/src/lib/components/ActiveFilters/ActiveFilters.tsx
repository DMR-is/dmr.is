import { Box } from '@island.is/island-ui/core/Box/Box'
import { Button } from '@island.is/island-ui/core/Button/Button'
import { Icon } from '@island.is/island-ui/core/IconRC/Icon'
import { Inline } from '@island.is/island-ui/core/Inline/Inline'
import { Tag } from '@island.is/island-ui/core/Tag/Tag'

type ActiveFilterItem = {
  label: string
  onClick?: () => void
}

type ActiveFiltersProps = {
  filters: ActiveFilterItem[]
  onClearLabel?: string
  onClear?: () => void
}
export const ActiveFilters = ({
  filters,
  onClearLabel,
  onClear,
}: ActiveFiltersProps) => {
  const filterCount = filters.length
  return (
    <Inline space={1} alignY="center">
      {filters.map((filter, i) => {
        return (
          <Box cursor="pointer" role="button" onClick={filter.onClick} key={i}>
            <Tag outlined variant="blue">
              <Box display="flex" alignItems="center">
                <span>{filter.label}</span>
                {filter.onClick && (
                  <Icon type="outline" icon="close" size="small" />
                )}
              </Box>
            </Tag>
          </Box>
        )
      })}
      {filterCount > 1 && onClear && (
        <Button onClick={onClear} variant="text" size="small" icon="reload">
          {onClearLabel}
        </Button>
      )}
    </Inline>
  )
}
