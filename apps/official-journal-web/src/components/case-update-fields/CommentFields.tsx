import { AccordionItem } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Comments } from '../comments/Comments'
import { messages } from '../comments/messages'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const CommentFields = ({ toggle, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <AccordionItem
      id="comment-fields"
      expanded={toggle}
      onToggle={onToggle}
      label={formatMessage(messages.comments.title)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Comments />
    </AccordionItem>
  )
}
