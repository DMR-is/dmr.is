import { Select, SkeletonLoader } from '@island.is/island-ui/core'

type Props<T> = React.ComponentProps<typeof Select<T>>

export const OJOISelect = <T,>({
  filterConfig,
  isLoading,
  ...rest
}: Props<T>) => {
  return isLoading ? (
    <SkeletonLoader height={64} borderRadius="standard" />
  ) : (
    <Select
      size="sm"
      backgroundColor="blue"
      {...rest}
      filterConfig={{ matchFrom: 'start' }}
    />
  )
}
