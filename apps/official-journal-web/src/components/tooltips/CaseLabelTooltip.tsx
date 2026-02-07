import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'
import { Tooltip } from './Tooltip'
import * as styles from './Tooltip.css'

type Props = {
  type: 'fasttrack' | 'new' | 'waiting'
}

export const CaseLabelTooltip = ({ type }: Props) => {
  const { formatMessage } = useFormatMessage()
  switch (type) {
    case 'fasttrack':
      return (
        <Tooltip text={formatMessage(messages.general.fasttrack)}>
          <Box className={styles.caseLabelTooltipIcon}>
            <Icon color="blue400" type="outline" icon="timer" />
          </Box>
        </Tooltip>
      )
    case 'new':
      return (
        <Tooltip text={formatMessage(messages.general.feedback)}>
          <Box className={styles.caseLabelTooltipIcon}>
            <Icon color="blue400" icon="warning" />
          </Box>
        </Tooltip>
      )
    case 'waiting':
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
