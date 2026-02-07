'use client'
import { useSession } from 'next-auth/react'

import { useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { AdvertDetailedDto, CommentDto, CommentTypeEnum } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = { advertId: string }

export const AddComment = ({ advertId }: Props) => {
  const [newComment, setNewComment] = useState('')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const session = useSession()
  const { mutate: postComment, isPending } = useMutation(
    trpc.postComment.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(
          trpc.getAdvert.queryFilter({ id: variables.advertId }),
        )
        const prevData = queryClient.getQueryData(
          trpc.getAdvert.queryKey({ id: variables.advertId }),
        ) as AdvertDetailedDto

        const newComment = {
          advertId: variables.advertId,
          comment: variables.comment,
          type: CommentTypeEnum.COMMENT,
          id: '1337',
          actor: session.data?.user?.name ?? '',
          status: prevData.status,
          createdAt: new Date().toISOString(),
        }
        const newComments = [newComment, ...prevData.comments]

        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: variables.advertId }),
          {
            ...prevData,
            comments: newComments as CommentDto[],
          },
        )

        return prevData
      },
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )
        setNewComment('')
      },
      onError: (_error, _variables, mutateResults) => {
        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: advertId }),
          mutateResults,
        )
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
