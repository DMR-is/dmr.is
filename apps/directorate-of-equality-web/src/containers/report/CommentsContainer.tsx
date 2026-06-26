'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CommentsForm } from '../../components/report/report-tabs/comments/CommentsForm'
import {
  CommentVisibilityEnum,
  ReportStatusEnum,
} from '../../gen/fetch/types.gen'
import { reportText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type CommentsContainerProps = {
  reportId: string
}

export function CommentsContainer({ reportId }: CommentsContainerProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const [isExternal, setIsExternal] = useState(false)

  const { data: report } = useQuery(
    trpc.reports.getById.queryOptions({ id: reportId }),
  )

  const { data: me } = useQuery(trpc.user.getMyUser.queryOptions())

  const { mutate: createComment, isPending } = useMutation({
    ...trpc.reportComments.create.mutationOptions(),
    onSuccess: () => {
      setBody('')
      setIsExternal(false)
      queryClient.invalidateQueries({
        queryKey: trpc.reports.getById.queryKey({ id: reportId }),
      })
    },
    onError: () => toast.error(reportText.comments.createError),
  })

  const { mutate: deleteComment } = useMutation({
    ...trpc.reportComments.delete.mutationOptions(),
    onSuccess: () => {
      toast.success(reportText.comments.deleteSuccess)
      queryClient.invalidateQueries({
        queryKey: trpc.reports.getById.queryKey({ id: reportId }),
      })
    },
    onError: () => toast.error(reportText.comments.deleteError),
  })

  const handleSubmit = () => {
    if (!body.trim()) return
    createComment({
      reportId,
      body,
      visibility: isExternal
        ? CommentVisibilityEnum.EXTERNAL
        : CommentVisibilityEnum.INTERNAL,
    })
  }

  const handleDelete = (commentId: string) => {
    deleteComment({ reportId, commentId })
  }

  return (
    <CommentsForm
      timeline={report?.timeline ?? []}
      companyName={report?.company?.name}
      currentUserId={me?.id}
      readonly={
        report?.status === ReportStatusEnum.APPROVED ||
        report?.status === ReportStatusEnum.DENIED
      }
      body={body}
      isExternal={isExternal}
      isPending={isPending}
      onBodyChange={setBody}
      onExternalChange={setIsExternal}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  )
}
