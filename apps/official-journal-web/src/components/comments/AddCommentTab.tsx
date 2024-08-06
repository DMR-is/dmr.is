import { useState } from 'react'

import { Box, Button, Input, Select, Stack } from '@island.is/island-ui/core'

import { CommunicationStatus } from '../../gen/fetch'
import { useAddComment, useCommunicationStatuses } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'

type Props = {
  caseId: string
  internal: boolean
  userId: string
  currentStatus: CommunicationStatus
  onAddCommentSuccess?: () => void
}

export const AddCommentTab = ({
  caseId,
  internal,
  userId,
  currentStatus,
  onAddCommentSuccess,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const [commentValue, setCommentValue] = useState('')

  const { data: statuses, isLoading } = useCommunicationStatuses()

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
        {statuses && !isLoading && (
          <Box width="half">
            <Select
              size="xs"
              name="communication-status"
              options={statuses.statuses.map((s) => ({
                label: s.value,
                value: s.id,
              }))}
              defaultValue={{
                value: currentStatus.id,
                label: currentStatus.value,
              }}
            />
          </Box>
        )}
        <Input
          disabled={isMutating}
          loading={isMutating}
          type="text"
          name="comment"
          label={formatMessage(messages.comments.label)}
          placeholder={formatMessage(messages.comments.placeholder)}
          value={commentValue}
          onChange={(e) => setCommentValue(e.target.value)}
          textarea
        />
        <Button
          disabled={!commentValue}
          onClick={() =>
            onAddComment({
              caseId: caseId,
              internal: internal,
              comment: commentValue,
              initator: userId,
            })
          }
        >
          {formatMessage(messages.comments.save)}
        </Button>
      </Stack>
    </Box>
  )
}
