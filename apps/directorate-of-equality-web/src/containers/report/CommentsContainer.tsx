'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CommentsForm } from '../../components/report/report-tabs/comments/CommentsForm'
import {
  CommentVisibilityEnum,
  CommunicationStatusEnum,
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

  // Internal notes are allowed on any report a reviewer can open (everything
  // but a draft). Messaging the applicant (external) is only possible while the
  // communication thread is open — opening/closing is an explicit action in the
  // sidebar, no longer a side effect of commenting.
  const isDraft = report?.status === ReportStatusEnum.DRAFT
  const canSendExternal =
    report?.communicationStatus === CommunicationStatusEnum.OPEN ||
    report?.communicationStatus ===
      CommunicationStatusEnum.AWAITING_RESPONSE ||
    report?.communicationStatus === CommunicationStatusEnum.RESPONSE_RECEIVED

  const handleSubmit = () => {
    if (!body.trim()) return
    createComment({
      reportId,
      body,
      visibility:
        isExternal && canSendExternal
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
      readonly={isDraft}
      canSendExternal={canSendExternal}
      body={body}
      isExternal={isExternal && canSendExternal}
      isPending={isPending}
      onBodyChange={setBody}
      onExternalChange={setIsExternal}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  )
}
