import {
  Select as IslandSelect,
  SkeletonLoader,
} from '@island.is/island-ui/core'

type Props = Omit<
  React.ComponentProps<typeof IslandSelect> & {
    isLoading?: boolean
  },
  'size'
>

export const Select = ({ isLoading = false, ...props }: Props) => {
  return isLoading ? (
    <SkeletonLoader height={64} borderRadius="large" />
  ) : (
    <IslandSelect size="sm" {...props} />
  )
}
