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

  const { data: comments = [] } = useQuery(
    trpc.reportComments.list.queryOptions({ reportId }),
  )

  const { mutate: createComment, isPending } = useMutation({
    ...trpc.reportComments.create.mutationOptions(),
    onSuccess: () => {
      setBody('')
      setIsExternal(false)
      queryClient.invalidateQueries({
        queryKey: trpc.reportComments.list.queryKey({ reportId }),
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

  return (
    <CommentsForm
      comments={comments}
      body={body}
      isExternal={isExternal}
      isPending={isPending}
      onBodyChange={setBody}
      onExternalChange={setIsExternal}
      onSubmit={handleSubmit}
    />
  )
}
