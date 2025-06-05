import {
  Select as IslandSelect,
  SkeletonLoader,
} from '@island.is/island-ui/core'

type Props = React.ComponentProps<typeof IslandSelect> & {
  isLoading?: boolean
}

export const Select = ({ isLoading = false, ...props }: Props) => {
  return isLoading ? (
    <SkeletonLoader height={64} borderRadius="large" />
  ) : (
    <IslandSelect {...props} />
  )
}
