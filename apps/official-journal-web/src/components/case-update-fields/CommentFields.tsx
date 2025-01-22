import { AccordionItem } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Comments } from '../comments/Comments'
import { messages } from '../comments/messages'

export const CommentFields = () => {
  const { formatMessage } = useFormatMessage()

  return (
    <AccordionItem
      startExpanded
      id="case-attributes-2"
      label={formatMessage(messages.comments.title)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Comments />
    </AccordionItem>
  )
}
