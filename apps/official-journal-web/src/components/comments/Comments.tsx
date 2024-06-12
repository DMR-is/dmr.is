import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'
import { Fragment, useState } from 'react'

import {
  Box,
  Button,
  Icon,
  Input,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { CaseCommentTypeEnum, CaseWithAdvert } from '../../gen/fetch'
import { useAddComment } from '../../hooks/useAddComment'
import { useCase } from '../../hooks/useCase'
import { useDeleteComment } from '../../hooks/useDeleteComment'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { commentTaskToNode } from '../../lib/utils'
import * as styles from './Comments.css'
import { messages } from './messages'
type Props = {
  activeCase: CaseWithAdvert
}

export const Comments = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()
  const [expanded, setExpanded] = useState(
    activeCase.activeCase.comments.length < 5,
  )
  const [commentValue, setCommentValue] = useState('')
  const [isInternalComment, setIsInternalComment] = useState(true) // TODO: Not sure how this will be implemented (checkbox, tabs?)
  const now = new Date()

  const { mutate: refetchCase, isLoading: isRefetchingCase } = useCase({
    caseId: activeCase.activeCase.id,
  })
  const { trigger: onDeleteComment, isMutating: isDeletingComment } =
    useDeleteComment({
      onSuccess: () => refetchCase(),
    })
  const { trigger: onAddComment, isMutating: isAddingComment } = useAddComment({
    onSuccess: () => {
      setCommentValue('')
      setIsInternalComment(true)
      refetchCase()
    },
  })

  const isLoading = isRefetchingCase || isDeletingComment || isAddingComment

  return (
    <Box borderRadius="large" padding={[2, 3, 5]} background="purple100">
      <Text variant="h5">{formatMessage(messages.comments.title)}</Text>

      {activeCase.activeCase.comments.map((c, i) => {
        const daysAgo = differenceInCalendarDays(now, new Date(c.createdAt))
        const suffix =
          String(daysAgo).slice(-1) === '1'
            ? formatMessage(messages.comments.day)
            : formatMessage(messages.comments.days)

        if (
          !expanded &&
          i !== 0 &&
          i < activeCase.activeCase.comments.length - 4
        ) {
          return null
        }

        return (
          <Fragment key={c.id}>
            <Box
              display="flex"
              justifyContent="spaceBetween"
              alignItems="center"
              padding={[1, 2, 3]}
              borderBottomWidth="standard"
              borderColor="purple200"
            >
              <Icon
                icon={
                  c.type === CaseCommentTypeEnum.Comment
                    ? 'pencil'
                    : 'arrowForward'
                }
                color="purple400"
                size="medium"
                className={styles.icon}
              />

              <div className={styles.text}>
                <Text>{commentTaskToNode(c.task)}</Text>
                {c.task.comment ? <Text>{c.task.comment}</Text> : null}
                <Button
                  loading={isDeletingComment}
                  variant="text"
                  as="button"
                  size="small"
                  onClick={() => {
                    onDeleteComment({
                      caseId: activeCase.activeCase.id,
                      commentId: c.id,
                    })
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    columnGap="smallGutter"
                  >
                    {formatMessage(messages.comments.deleteComment)}
                    <Icon icon="trash" type="outline" size="small" />
                  </Box>
                </Button>
              </div>

              <Text whiteSpace="nowrap">
                {daysAgo === 0
                  ? formatMessage(messages.comments.today)
                  : daysAgo === 1
                  ? formatMessage(messages.comments.yesterday)
                  : 'f. ' + daysAgo + ' ' + suffix}
              </Text>
            </Box>

            {!expanded && i === 0 ? (
              <Box
                display="flex"
                justifyContent="center"
                padding={[1, 2]}
                borderBottomWidth="standard"
                borderColor="purple200"
              >
                <Button
                  variant="text"
                  as="button"
                  size="small"
                  onClick={() => setExpanded(true)}
                >
                  {formatMessage(messages.comments.seeAll)} (
                  {activeCase.activeCase.comments.length - 5})
                </Button>
              </Box>
            ) : null}
          </Fragment>
        )
      })}

      {activeCase.activeCase.assignedTo && (
        <Box marginTop={2}>
          <Stack space={2}>
            <Input
              disabled={isLoading}
              loading={isLoading}
              type="text"
              name="comment"
              label={formatMessage(messages.comments.label)}
              placeholder={formatMessage(messages.comments.placeholder)}
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              textarea
            />
            <Button
              disabled={!commentValue}
              loading={isAddingComment}
              onClick={() =>
                onAddComment({
                  caseId: activeCase.activeCase.id,
                  internal: isInternalComment,
                  comment: commentValue,
                  from: activeCase.activeCase.assignedTo?.id ?? '',
                })
              }
            >
              {formatMessage(messages.comments.save)}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  )
}
