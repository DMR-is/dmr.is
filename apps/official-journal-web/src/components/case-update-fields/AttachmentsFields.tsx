import { AccordionItem } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Attachments } from '../attachments/Attachments'
import { messages } from '../form-steps/messages'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const AttachmentFields = ({ toggle, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <AccordionItem
      id="attachments"
      expanded={toggle}
      onToggle={onToggle}
      label={formatMessage(messages.grunnvinnsla.attachmentFiles)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Attachments />
    </AccordionItem>
  )
}
