import { Box, Icon } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'
import { Tooltip } from './Tooltip'
import * as styles from './Tooltip.css'

type Props = {
  label: string
}

export const CaseLabelTooltip = ({ label }: Props) => {
  const { formatMessage } = useFormatMessage()
  switch (label) {
    case 'fasttrack':
      return (
        <Tooltip text={formatMessage(messages.general.fasttrack)}>
          <Box className={styles.caseLabelTooltipIcon}>
            <Icon color="blue400" type="outline" icon="timer" />
          </Box>
        </Tooltip>
      )
    case 'warning':
      return (
        <Tooltip text={formatMessage(messages.general.feedback)}>
          <Box className={styles.caseLabelTooltipIcon}>
            <Icon color="blue400" icon="warning" />
          </Box>
        </Tooltip>
      )
    case 'info':
      return (
        <Tooltip text={formatMessage(messages.general.waiting)}>
          <Box className={styles.caseLabelTooltipIcon}>
            <Icon color="blue400" icon="informationCircle" />
          </Box>
        </Tooltip>
      )
    default:
      return null
  }
}
