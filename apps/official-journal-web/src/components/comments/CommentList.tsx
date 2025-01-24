import { useMemo } from 'react'

import { AlertMessage, Stack } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useToggle } from '../../hooks/useToggle'
import { COMMENTS_TO_SHOW } from '../../lib/constants'
import { Comment } from './Comment'

export const CommentList = () => {
  const { currentCase } = useCaseContext()
  const expanded = useToggle(false)

  const comments = useMemo(() => {
    return expanded.toggle
      ? currentCase.comments
      : currentCase.comments.slice(0, COMMENTS_TO_SHOW)
  }, [currentCase.comments, expanded.toggle])

  if (comments.length === 0) {
    return (
      <AlertMessage
        type="info"
        title="Engar athugasemdir"
        message="Engar athugasemdir fundust fyrir þetta mál"
      />
    )
  }

  return (
    <Stack space={1}>
      {comments.map((comment) => (
        <Comment comment={comment} key={comment.id} />
      ))}
    </Stack>
  )
}
