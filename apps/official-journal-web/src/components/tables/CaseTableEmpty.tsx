import { Table as T, Text } from '@island.is/island-ui/core'

import { messages } from '../../lib/messages'
import * as styles from './CaseTable.css'

type Props = {
  message?: string
}

export const CaseTableEmpty = ({ message }: Props) => {
  const msg = message ? message : messages.components.tables.empty.message
  return (
    <T.Body>
      <tr className={styles.emptyRow}>
        <div className={styles.emptyRowMessageWrapper}>
          <Text color="dark400">
            <span className={styles.emptyRowMessage}>{msg}</span>
          </Text>
        </div>
      </tr>
      <tr className={styles.emptyRow}></tr>
    </T.Body>
  )
}
