import { Box, Icon, Text } from '@island.is/island-ui/core'

import { messages } from '../../lib/messages'
import * as styles from './ControlPanel.css'
export const ControlPanel = () => {
  return (
    <Box className={styles.controlPanel}>
      <div className={styles.controlPanelWrapper}>
        <div>
          <div className={styles.controlPanelTitle}>
            {messages.components.controlPanel.title}
          </div>
          <Text>{messages.components.controlPanel.project}</Text>
        </div>
        <button
          onClick={() => console.log('not implemented!')}
          className={styles.controlPanelButton}
        >
          <Icon size="small" icon="chevronDown" type="outline" />
        </button>
      </div>
    </Box>
  )
}
