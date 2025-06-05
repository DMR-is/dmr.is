import { Input, SkeletonLoader } from '@island.is/island-ui/core'

type Props = Omit<
  React.ComponentProps<typeof Input> & {
    isLoading?: boolean
  },
  'size' | 'backgroundColor'
>

export const TextInput = ({ isLoading = false, ...props }: Props) => {
  return isLoading ? (
    <SkeletonLoader borderRadius="large" height={64} />
  ) : (
    <Input size="sm" backgroundColor="blue" {...props} />
  )
}
