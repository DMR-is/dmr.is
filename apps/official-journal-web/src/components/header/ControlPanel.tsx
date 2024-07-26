import { Box, Icon, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from './ControlPanel.css'
import { messages } from './messages'
export const ControlPanel = () => {
  const { formatMessage } = useFormatMessage()
  return (
    <Box className={styles.controlPanel}>
      <div className={styles.controlPanelWrapper}>
        <div>
          <div className={styles.controlPanelTitle}>
            {formatMessage(messages.general.controlPanelTitle)}
          </div>
          <Text>{formatMessage(messages.general.controlPanelProject)}</Text>
        </div>
        <button
          // eslint-disable-next-line no-console
          onClick={() => console.log('not implemented!')}
          className={styles.controlPanelButton}
        >
          <Icon size="small" icon="chevronDown" type="outline" />
        </button>
      </div>
    </Box>
  )
}
