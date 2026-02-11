import {Select as IslandSelect} from "../../island-is/lib/Select"
import { SkeletonLoader } from "../../island-is/lib/SkeletonLoader"

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
