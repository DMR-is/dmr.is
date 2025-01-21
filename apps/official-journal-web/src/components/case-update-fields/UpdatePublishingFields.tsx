import { AccordionItem, Stack } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'

export const UpdateCasePublishingFields = () => {
  const { formatMessage } = useFormatMessage()

  return (
    <AccordionItem
      startExpanded
      id="case-attributes-2"
      label={formatMessage(messages.grunnvinnsla.group2title)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Stack space={2}>
        <OJOIInput
          disabled
          width="half"
          name="createdDate"
          value={new Date().toLocaleDateString()}
          label={formatMessage(messages.grunnvinnsla.createdDate)}
        />
        <OJOIInput
          width="half"
          name="publicationDate"
          value={new Date().toLocaleDateString()}
          label={formatMessage(messages.grunnvinnsla.publicationDate)}
        />
        <OJOIInput
          width="half"
          name="price"
          label={formatMessage(messages.grunnvinnsla.price)}
          type="number"
          inputMode="numeric"
        />
        <OJOIInput
          width="half"
          name="paid"
          label={formatMessage(messages.grunnvinnsla.paid)}
          type="checkbox"
        />
      </Stack>
    </AccordionItem>
  )
}
