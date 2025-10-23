'use client'
import { useState } from 'react'

import {
  Button,
  Inline,
  Input,
  Stack,
  toast,
} from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../lib/nTrpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = { advertId: string }

export const AddComment = ({ advertId }: Props) => {
  const [newComment, setNewComment] = useState('')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutate: postComment, isPending } = useMutation(
    trpc.postComment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.getComments.queryFilter({ advertId: advertId }),
        )
        setNewComment('')
      },
      onError: () => {
        toast.error('Villa við að vista athugasemd: ', {
          toastId: 'post-comment-error',
        })
      },
    }),
  )

  return (
    <Stack space={2}>
      <Input
        name="new-comment"
        textarea
        label="Athugasemd"
        placeholder="Skrifaðu athugasemd hér..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <Inline align="right">
        <Button
          size="small"
          disabled={newComment.length === 0}
          variant="primary"
          loading={isPending}
          onClick={() =>
            postComment({
              advertId: advertId,
              comment: newComment,
            })
          }
        >
          Vista athugasemd
        </Button>
      </Inline>
    </Stack>
  )
}
