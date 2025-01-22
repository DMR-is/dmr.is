import { AccordionItem } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Attachments } from '../attachments/Attachments'
import { messages } from '../form-steps/messages'

export const AttachmentFields = () => {
  const { formatMessage } = useFormatMessage()
  const { currentCase } = useCaseContext()

  return (
    <AccordionItem
      startExpanded
      id="case-attributes-2"
      label={formatMessage(messages.grunnvinnsla.attachments)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Attachments activeCase={currentCase} />
    </AccordionItem>
  )
}
