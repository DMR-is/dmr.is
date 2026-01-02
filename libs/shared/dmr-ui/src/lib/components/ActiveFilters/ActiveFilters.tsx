import { Box, Button, Icon, Inline, Tag } from '@island.is/island-ui/core'

type ActiveFilterItem = {
  label: string
  variant?: React.ComponentProps<typeof Tag>['variant']
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
    <Inline space={1}>
      {filters.map((filter, i) => {
        return (
          <Box
            cursor="pointer"
            role="button"
            onClick={filter.onClick}
            key={i}
            paddingBottom={2}
          >
            <Tag outlined variant={filter.variant}>
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
        <Box marginLeft={1}>
          <Button onClick={onClear} variant="text" size="small" icon="reload">
            {onClearLabel}
          </Button>
        </Box>
      )}
    </Inline>
  )
}
