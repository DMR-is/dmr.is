import { Box } from '../../island-is/lib/Box'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
import { Tooltip } from '../../island-is/lib/Tooltip'
import * as styles from './SearchDashboard.css'
import type { SearchDashboardKpiItem } from './types'

type Props = {
  items: SearchDashboardKpiItem[]
}

export const SearchDashboardKpiGrid = ({ items }: Props) => {
  return (
    <Box className={styles.kpiGrid}>
      {items.map((item) => (
        <Box className={styles.card} key={item.label}>
          <Stack space={1}>
            <Box className={styles.labelWithTooltip}>
              <Text variant="eyebrow">{item.label}</Text>
              {item.helpText ? (
                <Tooltip text={item.helpText} placement="top" color="blue400" />
              ) : null}
            </Box>
            <Text as="div" className={styles.kpiValue}>
              {item.value}
            </Text>
            {item.description ? (
              <Text variant="small">{item.description}</Text>
            ) : null}
          </Stack>
        </Box>
      ))}
    </Box>
  )
}
