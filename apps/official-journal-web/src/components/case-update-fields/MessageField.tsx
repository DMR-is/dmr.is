import { AccordionItem } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'

export const MessageField = () => {
  const { formatMessage } = useFormatMessage()

  const { currentCase } = useCaseContext()

  return (
    <AccordionItem
      startExpanded
      id="case-attributes-2"
      label="Skilaboð"
      labelVariant="h5"
      iconVariant="small"
    >
      <OJOIInput
        readOnly
        textarea
        rows={4}
        name="message"
        label={formatMessage(messages.grunnvinnsla.message)}
        value={currentCase.message ?? ''}
      />
    </AccordionItem>
  )
}
