import { Text } from '../../island-is/lib/Text'
import { SearchDashboardPanel } from './SearchDashboardPanel'
import type { SearchDashboardEmptyStateProps } from './types'

export const SearchDashboardEmptyState = ({
  title,
  message,
}: SearchDashboardEmptyStateProps) => {
  return (
    <SearchDashboardPanel title={title}>
      <Text>{message}</Text>
    </SearchDashboardPanel>
  )
}
