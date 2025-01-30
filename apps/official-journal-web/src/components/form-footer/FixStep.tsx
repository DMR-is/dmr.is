import { Button } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../../lib/messages/caseSingle'

type Props = {
  caseId: string
  fixStep: boolean
  canPublishFix: boolean
  loading?: boolean
  updateAdvertHtmlTrigger: () => void
  refetch?: () => void
}

export const FixStep = ({
  fixStep,
  canPublishFix,
  loading,
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
      loading={loading}
    >
      {formatMessage(messages.paging.confirmFixStep)}
    </Button>
  )
}
