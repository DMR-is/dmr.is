import { AccordionItem } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const MessageField = ({ toggle, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()

  const { currentCase } = useCaseContext()

  return (
    <AccordionItem
      id="message"
      expanded={toggle}
      onToggle={onToggle}
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
