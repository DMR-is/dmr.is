import { Box } from '../../island-is/lib/Box'
import { Inline } from '../../island-is/lib/Inline'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
import * as styles from './SearchDashboard.css'
import { SearchDashboardPanel } from './SearchDashboardPanel'
import type { SearchDashboardBreakdownCardProps } from './types'

export const SearchDashboardBreakdownCard = ({
  title,
  description,
  helpText,
  items,
}: SearchDashboardBreakdownCardProps) => {
  return (
    <SearchDashboardPanel
      title={title}
      description={description}
      helpText={helpText}
    >
      {items.length === 0 ? (
        <Text variant="small">Engin gögn á völdu tímabili</Text>
      ) : (
        <Box className={styles.breakdownList}>
            {items.map((item) => (
              <Stack space={1} key={item.label}>
                <Inline justifyContent="spaceBetween" alignY="center">
                  <Text variant="small" fontWeight="semiBold">
                    {item.label}
                  </Text>
                  <Text variant="small">
                    {item.value} ({item.count})
                  </Text>
                </Inline>
                <Box className={styles.breakdownTrack}>
                  <Box
                    className={styles.breakdownFill}
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </Box>
              </Stack>
            ))}
        </Box>
      )}
    </SearchDashboardPanel>
  )
}
