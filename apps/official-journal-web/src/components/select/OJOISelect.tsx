import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
// TODO: Change import
import { BoxProps } from '@island.is/island-ui/core'

import { OJOIInput } from './OJOIInput'

type Props<T> = React.ComponentProps<typeof Select<T>> & {
  width?: BoxProps['width']
  isValidating?: boolean
}

export const OJOISelect = <T,>({
  filterConfig,
  isLoading,
  isValidating,
  width,
  ...rest
}: Props<T>) => {
  let valueString = ''
  if (typeof rest.value === 'string') {
    valueString = rest.value
  }

  if (rest.value && 'label' in rest.value) {
    valueString = rest.value.label as string
  }

  return (
    <Box width={width}>
      {isLoading ? (
        <SkeletonLoader height={64} borderRadius="standard" />
      ) : isValidating ? (
        <OJOIInput
          name=""
          disabled
          label={rest.label}
          value={valueString}
          isValidating
        />
      ) : (
        <Select
          size="sm"
          backgroundColor="blue"
          isLoading={false}
          {...rest}
          filterConfig={{ matchFrom: 'start' }}
        />
      )}
    </Box>
  )
}
