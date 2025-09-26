import { useState } from 'react'

import {
  Box,
  Button,
  Inline,
  Input,
  Select,
  Stack,
} from '@island.is/island-ui/core'

import { useAddComment, useCommunicationStatuses } from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useUpdateCommunicationStatus } from '../../hooks/api/update/useUpdateCommunicationStatus'
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
  const { data: statuses, isLoading } = useCommunicationStatuses({
    options: {},
  })

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

  const { trigger: updateCommunicationStatus } = useUpdateCommunicationStatus({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        refetch()
      },
    },
  })

  const isMutating = isCreatingExternalComment || isCreatingInternalComment

  return (
    <Box>
      <Stack space={2}>
        {statuses && !isLoading && (
          <Box width="half">
            <Select
              size="xs"
              name="communication-status"
              onChange={(e) => {
                if (!e) return
                updateCommunicationStatus({
                  statusId: e.value,
                })
              }}
              options={statuses.statuses.map((s) => ({
                label: s.title,
                value: s.id,
              }))}
              defaultValue={{
                value: currentCase.communicationStatus.id,
                label: currentCase.communicationStatus.title,
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
          placeholder={placeholder}
          value={commentValue}
          onChange={(e) => setCommentValue(e.target.value)}
          textarea
        />
        <Inline justifyContent="flexEnd">
          <Button
            size="small"
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
        </Inline>
      </Stack>
    </Box>
  )
}
