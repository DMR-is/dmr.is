import { Input, SkeletonLoader } from '@island.is/island-ui/core'

type Props = React.ComponentProps<typeof Input> & {
  isLoading?: boolean
}

export const TextInput = ({ isLoading = false, ...props }: Props) => {
  return isLoading ? (
    <SkeletonLoader borderRadius="large" height={64} />
  ) : (
    <Input {...props} />
  )
}
