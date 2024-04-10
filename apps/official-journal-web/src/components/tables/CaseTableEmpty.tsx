import { Table as T, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  message?: string
  columns: number
}

export const CaseTableEmpty = ({ message, columns }: Props) => {
  const { formatMessage } = useFormatMessage()
  const msg = message ? message : formatMessage(messages.general.emptyTable)
  return (
    <T.Body>
      <tr className={styles.emptyRow}>
        <td colSpan={columns}>
          <div className={styles.emptyRowMessageWrapper}>
            <Text color="dark400">
              <span className={styles.emptyRowMessage}>{msg}</span>
            </Text>
          </div>
        </td>
      </tr>
      <tr className={styles.emptyRow}></tr>
    </T.Body>
  )
}
