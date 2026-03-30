import { SkeletonLoader } from '../../island-is/lib/SkeletonLoader'
import { Stack } from '../../island-is/lib/Stack'

export const SearchDashboardLoading = () => {
  return (
    <Stack space={3}>
      <SkeletonLoader height={120} repeat={1} borderRadius="large" />
      <SkeletonLoader height={160} repeat={1} borderRadius="large" />
      <SkeletonLoader height={220} repeat={2} borderRadius="large" />
    </Stack>
  )
}
