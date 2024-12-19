import { Select, SkeletonLoader } from '@island.is/island-ui/core'

type Props<T> = React.ComponentProps<typeof Select<T>>

export const OJOISelect = <T,>({ isLoading, ...rest }: Props<T>) => {
  return isLoading ? (
    <SkeletonLoader height={64} borderRadius="standard" />
  ) : (
    <Select {...rest} />
  )
}
