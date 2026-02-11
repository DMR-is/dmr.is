import { Input } from "../../island-is/lib/Input"
import { SkeletonLoader } from "../../island-is/lib/SkeletonLoader"

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
