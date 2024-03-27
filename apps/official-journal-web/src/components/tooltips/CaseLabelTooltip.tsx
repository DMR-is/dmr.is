import { Box, Icon } from '@island.is/island-ui/core'

import { messages } from '../../lib/messages'
import { Tooltip } from './Tooltip'
import * as styles from './Tooltip.css'

type Props = {
  label: string
}

export const CaseLabelTooltip = ({ label }: Props) => {
  switch (label) {
    case 'fasttrack':
      return (
        <Tooltip
          text={messages.components.tables.caseOverview.labels.fasttrack}
        >
          <Box className={styles.caseLabelTooltipIcon}>
            <Icon color="blue400" type="outline" icon="timer" />
          </Box>
        </Tooltip>
      )
    case 'warning':
      return (
        <Tooltip text={messages.components.tables.caseOverview.labels.warning}>
          <Box className={styles.caseLabelTooltipIcon}>
            <Icon color="blue400" icon="warning" />
          </Box>
        </Tooltip>
      )
    case 'info':
      return (
        <Tooltip text={messages.components.tables.caseOverview.labels.info}>
          <Box className={styles.caseLabelTooltipIcon}>
            <Icon color="blue400" icon="informationCircle" />
          </Box>
        </Tooltip>
      )
    default:
      return null
  }
}
