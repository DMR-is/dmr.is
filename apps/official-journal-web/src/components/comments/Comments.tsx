import { Fragment, useMemo, useState } from 'react'
import AnimateHeight from 'react-animate-height'

import {
  Box,
  Button,
  Icon,
  Inline,
  Stack,
  Tabs,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { useDeleteComment } from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { COMMENTS_TO_HIDE } from '../../lib/constants'
import { commentToNode, getCommentIcon } from '../../lib/utils'
import { AddCommentTab } from './AddCommentTab'
import { CommentList } from './CommentList'
import * as styles from './Comments.css'
import { messages } from './messages'
type Props = {
  onAddCommentSuccess?: () => void
  showHideButton?: boolean
}

export const Comments = ({ showHideButton, onAddCommentSuccess }: Props) => {
  const { formatMessage } = useFormatMessage()

  // const { currentCase, refetch } = useCaseContext()
  // const [expanded, setExpanded] = useState(currentCase.comments.length < 6)
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [hiddenComments, setHiddenComments] = useState(false)

  // const { trigger: onDeleteComment, isMutating: isDeletingComment } =
  //   useDeleteComment({
  //     options: {
  //       onSuccess: () => {
  //         const currentCommentCount = currentCase.comments.length - 1
  //         if (currentCommentCount <= COMMENTS_TO_HIDE) {
  //           setExpanded(true)
  //         }

  //         refetch()
  //       },
  //     },
  //   })

  // const sortedComments = useMemo(() => {
  //   return currentCase.comments.sort((a, b) => {
  //     if (order === 'asc') {
  //       return new Date(a.ageIso).getTime() - new Date(b.ageIso).getTime()
  //     } else {
  //       return new Date(b.ageIso).getTime() - new Date(a.ageIso).getTime()
  //     }
  //   })
  // }, [currentCase.comments, order])

  return (
    <Box borderRadius="large" padding={[2, 3, 5]} background="blue100">
      <Stack space={2}>
        {/* <Inline justifyContent="flexEnd" space={2} alignY="center">
          {!!showHideButton && (
            <button
              className={styles.orderButton({ order: 'asc' })}
              title={
                hiddenComments
                  ? formatMessage(messages.comments.commentsShow)
                  : formatMessage(messages.comments.commentsHide)
              }
              onClick={() => setHiddenComments(!hiddenComments)}
            >
              <Icon
                icon={hiddenComments ? 'eye' : 'eyeOff'}
                color="blue400"
                size="medium"
              />
            </button>
          )}

          <button
            className={styles.orderButton({ order: order })}
            onClick={() =>
              setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
          >
            <Icon icon="arrowUp" color="blue400" size="medium" />
          </button>
        </Inline> */}
        <AnimateHeight duration={450} height={hiddenComments ? 0 : 'auto'}>
          <CommentList />
        </AnimateHeight>
      </Stack>
    </Box>
  )
}
