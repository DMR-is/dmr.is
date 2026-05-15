'use client'

import { useState } from 'react'

import { CommentsForm } from '../../components/report/report-tabs/CommentsForm'
import { CommentVisibilityEnum } from '../../gen/fetch/types.gen'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

  const { data: users = [] } = useQuery(trpc.user.listActive.queryOptions())
  const { data: me } = useQuery(trpc.user.getMyUser.queryOptions())

  const usersById = new Map(users.map((u) => [u.id, u]))

  const { mutate: createComment, isPending } = useMutation({
    ...trpc.reportComments.create.mutationOptions(),
    onSuccess: () => {
      setBody('')
      setIsExternal(false)
      queryClient.invalidateQueries({
        queryKey: trpc.reports.getById.queryKey({ id: reportId }),
      })
    },
  })

  const { mutate: deleteComment } = useMutation({
    ...trpc.reportComments.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.reports.getById.queryKey({ id: reportId }),
      })
    },
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
      usersById={usersById}
      companyName={report?.company?.name}
      currentUserId={me?.id}
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
