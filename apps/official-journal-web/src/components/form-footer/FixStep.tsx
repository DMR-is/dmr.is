import { Button } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../../lib/messages/caseSingle'

type Props = {
  caseId: string
  fixStep: boolean
  canPublishFix: boolean
  updateAdvertHtmlTrigger: () => void
  refetch?: () => void
}

export const FixStep = ({
  fixStep,
  canPublishFix,
  updateAdvertHtmlTrigger,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  if (!fixStep) {
    return null
  }

  return (
    <Button
      disabled={!canPublishFix}
      colorScheme="destructive"
      icon="arrowForward"
      onClick={updateAdvertHtmlTrigger}
    >
      {formatMessage(messages.paging.confirmFixStep)}
    </Button>
  )
}
