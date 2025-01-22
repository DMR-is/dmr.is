import { AccordionItem } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Attachments } from '../attachments/Attachments'
import { messages } from '../form-steps/messages'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const AttachmentFields = ({ toggle, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()
  const { currentCase } = useCaseContext()

  return (
    <AccordionItem
      id="attachments"
      expanded={toggle}
      onToggle={onToggle}
      label={formatMessage(messages.grunnvinnsla.attachments)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Attachments activeCase={currentCase} />
    </AccordionItem>
  )
}
