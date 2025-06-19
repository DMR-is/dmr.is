import {
  Select as IslandSelect,
  SkeletonLoader,
} from '@island.is/island-ui/core'

type Props<T> = Omit<
  React.ComponentProps<typeof IslandSelect<T>> & {
    isLoading?: boolean
  },
  'size'
>

export const Select = <T,>({ isLoading = false, ...props }: Props<T>) => {
  return isLoading ? (
    <SkeletonLoader height={64} borderRadius="large" />
  ) : (
    <IslandSelect size="sm" {...props} />
  )
}
