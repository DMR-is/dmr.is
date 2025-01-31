import { useMemo } from 'react'

import {
  AlertMessage,
  Box,
  Button,
  Inline,
  Stack,
} from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useToggle } from '../../hooks/useToggle'
import { COMMENTS_TO_SHOW } from '../../lib/constants'
import { sliceFirstAndLast } from '../../lib/utils'
import { Comment } from './Comment'

export const CommentList = () => {
  const { currentCase } = useCaseContext()
  const expanded = useToggle(false)
  const orderAsc = useToggle(true)
  const totalComments = currentCase.comments.length
  const hiddenComments = totalComments - COMMENTS_TO_SHOW

  const comments = useMemo(() => {
    const commentsToShow = expanded.toggle
      ? currentCase.comments
      : sliceFirstAndLast(currentCase.comments, COMMENTS_TO_SHOW - 1)

    return commentsToShow.sort((a, b) => {
      if (orderAsc.toggle) {
        return new Date(a.created).getTime() > new Date(b.created).getTime()
          ? 1
          : -1
      }
      return new Date(a.created).getTime() > new Date(b.created).getTime()
        ? -1
        : 1
    })
  }, [currentCase.comments, expanded.toggle, orderAsc.toggle])

  return (
    <Stack space={1}>
      {comments.length === 0 && (
        <Box paddingTop={[2, 2, 3]}>
          <AlertMessage
            type="info"
            title="Engar athugasemdir"
            message="Engar athugasemdir fundust fyrir þetta mál"
          />
        </Box>
      )}
      {totalComments > COMMENTS_TO_SHOW && (
        <Box
          padding={[2, 2, 3]}
          borderBottomWidth="standard"
          borderColor="blue200"
        >
          <Inline justifyContent="spaceBetween" alignY="center">
            <Button variant="text" size="small" onClick={expanded.onToggle}>
              {expanded.toggle
                ? `Sjá færri athugasemdir (${COMMENTS_TO_SHOW})`
                : `Sýna allar athugasemdir (${hiddenComments})`}
            </Button>
            <Button
              circle
              variant="ghost"
              icon={orderAsc.toggle ? 'arrowDown' : 'arrowUp'}
              onClick={orderAsc.onToggle}
            />
          </Inline>
        </Box>
      )}
      {comments.map((comment) => (
        <Comment comment={comment} key={comment.id} />
      ))}
    </Stack>
  )
}
