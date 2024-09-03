import { useState } from 'react'

import { Box, Button, Input, Select, Stack } from '@island.is/island-ui/core'

import { CommunicationStatus } from '../../gen/fetch'
import { useAddComment, useCommunicationStatuses } from '../../hooks/api'
import { useUpdateCommunicationStatus } from '../../hooks/api/update/useUpdateCommunicationStatus'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'

type Props = {
  caseId: string
  internal: boolean
  userId: string
  currentStatus: CommunicationStatus
  inputPlaceholder?: string
  onAddCommentSuccess?: () => void
  onUpdateStatusSuccess?: () => void
}

export const AddCommentTab = ({
  caseId,
  internal,
  userId,
  inputPlaceholder,
  onAddCommentSuccess,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const [commentValue, setCommentValue] = useState('')

  const { trigger: onAddComment, isMutating } = useAddComment({
    caseId: caseId,
    options: {
      onSuccess: () => {
        setCommentValue('')
        onAddCommentSuccess && onAddCommentSuccess()
      },
    },
  })

  return (
    <Box marginTop={2}>
      <Stack space={2}>
        <Input
          disabled={isMutating}
          loading={isMutating}
          type="text"
          name="comment"
          label={formatMessage(messages.comments.label)}
          placeholder={inputPlaceholder}
          value={commentValue}
          onChange={(e) => setCommentValue(e.target.value)}
          textarea
        />
        <Button
          disabled={!commentValue}
          onClick={() => {
            onAddComment({
              caseId: caseId,
              internal: internal,
              comment: commentValue,
              initator: userId,
            })
          }}
        >
          {formatMessage(messages.comments.save)}
        </Button>
      </Stack>
    </Box>
  )
}
