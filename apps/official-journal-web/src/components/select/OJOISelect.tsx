import {
  Box,
  BoxProps,
  Select,
  SkeletonLoader,
} from '@island.is/island-ui/core'

type Props<T> = React.ComponentProps<typeof Select<T>> & {
  width?: BoxProps['width']
}

export const OJOISelect = <T,>({
  filterConfig,
  isLoading,
  width,
  ...rest
}: Props<T>) => {
  return (
    <Box width={width}>
      {isLoading ? (
        <SkeletonLoader height={64} borderRadius="standard" />
      ) : (
        <Select
          size="sm"
          backgroundColor="blue"
          {...rest}
          filterConfig={{ matchFrom: 'start' }}
        />
      )}
    </Box>
  )
}
