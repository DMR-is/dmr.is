import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { messages } from './messages'

import { useMutation } from '@tanstack/react-query'

type Props = {
  placeholder: string
  internal: boolean
}
export const AddCommentTab = ({ internal, placeholder }: Props) => {
  const { formatMessage } = useFormatMessage()
  const { currentCase, refetch } = useCaseContext()
  const trpc = useTRPC()

  const [commentValue, setCommentValue] = useState('')

  const { data: statuses, isLoading } = useQuery(
    trpc.getCommunicationStatuses.queryOptions(),
  )

  const createExternalComment = useMutation(
    trpc.createExternalComment.mutationOptions({
      onSuccess: () => {
        setCommentValue('')
        refetch()
      },
    }),
  )

  const createInternalComment = useMutation(
    trpc.createInternalComment.mutationOptions({
      onSuccess: () => {
        setCommentValue('')
        refetch()
      },
    }),
  )

  const updateCommunicationStatus = useMutation(
    trpc.updateCommunicationStatus.mutationOptions({
      onSuccess: () => {
        refetch()
      },
    }),
  )

  const isMutating =
    createExternalComment.isPending || createInternalComment.isPending

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
                updateCommunicationStatus.mutate({
                  id: currentCase.id,
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
                createInternalComment.mutate({
                  id: currentCase.id,
                  comment: commentValue,
                })
              } else {
                createExternalComment.mutate({
                  id: currentCase.id,
                  comment: commentValue,
                })
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
