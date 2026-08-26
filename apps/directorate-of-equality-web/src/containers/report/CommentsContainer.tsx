'use client'

import { useEffect, useState } from 'react'

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { data: report } = useQuery(
    trpc.reports.getById.queryOptions({ id: reportId }),
  )

  const { data: me } = useQuery(trpc.user.getMyUser.queryOptions())

  const { mutate: createComment, isPending } = useMutation({
    ...trpc.reportComments.create.mutationOptions(),
    onSuccess: (_data, variables) => {
      setBody('')
      setIsExternal(false)
      setIsConfirmOpen(false)
      // An external comment is not undoable — it has emailed the applicant and
      // reopened their island.is application — so say plainly that it left.
      // An internal note is visible in the timeline the moment it lands and
      // needs no announcement.
      if (variables.visibility === CommentVisibilityEnum.EXTERNAL) {
        toast.success(reportText.comments.externalSuccess)
      }
      queryClient.invalidateQueries({
        queryKey: trpc.reports.getById.queryKey({ id: reportId }),
      })
      // The communication status moved as a side effect of the comment, and the
      // overview surfaces it — refresh the list too.
      queryClient.invalidateQueries({
        queryKey: trpc.reports.list.queryKey(),
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
  // but a draft). Messaging the applicant reopens their island.is application,
  // so it is only offered while the report is actually under review.
  const isDraft = report?.status === ReportStatusEnum.DRAFT
  const canSendExternal = report?.status === ReportStatusEnum.IN_REVIEW

  // The sidebar can move the report out of review while the reviewer is mid
  // comment. The checkbox disables itself, but a tick left standing behind it
  // would re-appear on its own if the status came back — drop it instead, so
  // sending to the applicant is always something the reviewer just chose.
  useEffect(() => {
    if (!canSendExternal) {
      setIsExternal(false)
      setIsConfirmOpen(false)
    }
  }, [canSendExternal])

  const handleSubmit = () => {
    if (!body.trim()) return

    // Visible to the applicant means "send this report back for changes" —
    // confirm the wording before it leaves.
    if (isExternal && canSendExternal) {
      setIsConfirmOpen(true)
      return
    }

    createComment({
      reportId,
      body,
      visibility: CommentVisibilityEnum.INTERNAL,
    })
  }

  const handleConfirmExternal = () => {
    if (!body.trim()) return

    createComment({
      reportId,
      body,
      visibility: CommentVisibilityEnum.EXTERNAL,
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
      isConfirmOpen={isConfirmOpen}
      onBodyChange={setBody}
      onExternalChange={setIsExternal}
      onSubmit={handleSubmit}
      onConfirmExternal={handleConfirmExternal}
      onCancelExternal={() => {
        // The send is already on its way; closing now would hide the only
        // spinner the reviewer has and invite a second click.
        if (isPending) return
        setIsConfirmOpen(false)
      }}
      onDelete={handleDelete}
    />
  )
}
