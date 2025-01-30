import { useState } from 'react'

import { Box, Button, Input, Stack } from '@island.is/island-ui/core'

import { useAddComment } from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from './messages'

type Props = {
  placeholder: string
  internal: boolean
}
export const AddCommentTab = ({ internal, placeholder }: Props) => {
  const { formatMessage } = useFormatMessage()
  const { currentCase, refetch } = useCaseContext()

  const [commentValue, setCommentValue] = useState('')

  const {
    createExternalComment,
    createInternalComment,
    isCreatingExternalComment,
    isCreatingInternalComment,
  } = useAddComment({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        setCommentValue('')
        refetch()
      },
    },
  })

  const isMutating = isCreatingExternalComment || isCreatingInternalComment

  return (
    <Box>
      <Stack space={2}>
        <Input
          disabled={isMutating}
          loading={isMutating}
          type="text"
          name="comment"
          label={formatMessage(messages.comments.label)}
          placeholder={placeholder}
          value={commentValue}
          onChange={(e) => setCommentValue(e.target.value)}
          textarea
        />
        <Button
          disabled={!commentValue}
          onClick={() => {
            if (internal) {
              createInternalComment({ comment: commentValue })
            } else {
              createExternalComment({ comment: commentValue })
            }
          }}
        >
          {formatMessage(messages.comments.save)}
        </Button>
      </Stack>
    </Box>
  )
}
