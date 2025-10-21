'use client'
import { useState } from 'react'

import {
  Button,
  Inline,
  Input,
  Stack,
  toast,
} from '@dmr.is/ui/components/island-is'

import { trpc } from '../../lib/trpc/client'

type Props = { advertId: string }

export const AddComment = ({ advertId }: Props) => {
  const [newComment, setNewComment] = useState('')

  const utils = trpc.useUtils()

  const { mutate: postComment, isPending } =
    trpc.commentsApi.postComment.useMutation({
      onSuccess: () => {
        utils.commentsApi.getComments.invalidate({ advertId: advertId })
        setNewComment('')
      },
      onError: () => {
        toast.error('Villa við að vista athugasemd: ', {
          toastId: 'post-comment-error',
        })
      },
    })

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
