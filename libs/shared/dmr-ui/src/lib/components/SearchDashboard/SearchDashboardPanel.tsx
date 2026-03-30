import type { ReactNode } from 'react'

import { Box } from '../../island-is/lib/Box'
import { Inline } from '../../island-is/lib/Inline'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
import { Tooltip } from '../../island-is/lib/Tooltip'
import * as styles from './SearchDashboard.css'

type Props = {
  title?: string
  description?: string
  helpText?: string
  action?: ReactNode
  children: ReactNode
}

export const SearchDashboardPanel = ({
  title,
  description,
  helpText,
  action,
  children,
}: Props) => {
  return (
    <Box className={styles.section}>
      <Stack space={2}>
        {title || description || action ? (
          <Stack space={1}>
            {title || action ? (
              <Inline justifyContent="spaceBetween" alignY="center">
                {title ? (
                  <Box className={styles.labelWithTooltip}>
                    <Text variant="h4">{title}</Text>
                    {helpText ? (
                      <Tooltip
                        text={helpText}
                        placement="top"
                        color="blue400"
                      />
                    ) : null}
                  </Box>
                ) : (
                  <Box />
                )}
                {action ?? null}
              </Inline>
            ) : null}
            {description ? <Text variant="small">{description}</Text> : null}
          </Stack>
        ) : null}
        {children}
      </Stack>
    </Box>
  )
}
