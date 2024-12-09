import { Input } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'

type Props = {
  message: string
}

export const EditorMessageDisplay = ({ message }: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <Input
      type="text"
      name="comment"
      label={formatMessage(messages.general.label)}
      value={message}
      readOnly
      textarea
    />
  )
}
