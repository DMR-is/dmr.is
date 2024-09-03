import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'
import { Fragment, useState } from 'react'

import { Box, Button, Icon, Tabs, Text } from '@island.is/island-ui/core'

import { CaseCommentTypeEnum, CaseWithAdvert } from '../../gen/fetch'
import { useCase, useDeleteComment } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { APIRotues } from '../../lib/constants'
import { commentTaskToNode } from '../../lib/utils'
import { AddCommentTab } from './AddCommentTab'
import * as styles from './Comments.css'
import { messages } from './messages'
type Props = {
  activeCase: CaseWithAdvert
}

export const Comments = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()

  const [expanded, setExpanded] = useState(
    activeCase.activeCase.comments.length < 6,
  )

  const now = new Date()

  const { mutate: refetchCase, isLoading: isRefetchingCase } = useCase({
    caseId: activeCase.activeCase.id,
  })
  const { trigger: onDeleteComment, isMutating: isDeletingComment } =
    useDeleteComment({
      basePath: APIRotues.DeleteComment.replace(
        ':id',
        activeCase.activeCase.id,
      ),
      options: {
        onSuccess: () => {
          refetchCase()
        },
      },
    })

  const isLoading = isRefetchingCase || isDeletingComment

  return (
    <Box borderRadius="large" padding={[2, 3, 5]} background="purple100">
      <Text variant="h5">{formatMessage(messages.comments.title)}</Text>
      {activeCase.activeCase.comments.length === 0 ? (
        <Text>Engar athugasemdir fundust fyrir þetta mál</Text>
      ) : (
        activeCase.activeCase.comments.map((c, i) => {
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
                  <Text>{commentTaskToNode(c.task, c.caseStatus)}</Text>
                  {c.task.comment ? <Text>{c.task.comment}</Text> : null}
                  <Button
                    loading={isLoading}
                    variant="text"
                    as="button"
                    size="small"
                    onClick={() =>
                      onDeleteComment({
                        commentId: c.id,
                      })
                    }
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
        })
      )}

      {activeCase.activeCase.assignedTo && (
        <Box padding={4} background="white">
          <Box borderTopWidth="standard" borderColor="blue200">
            <Tabs
              onlyRenderSelectedTab={true}
              selected="internal"
              contentBackground="white"
              tabs={[
                {
                  id: 'internal',
                  label: formatMessage(messages.comments.internalComments),
                  content: (
                    <AddCommentTab
                      caseId={activeCase.activeCase.id}
                      internal={true}
                      userId={activeCase.activeCase.assignedTo.id}
                      inputPlaceholder={formatMessage(
                        messages.comments.internalCommentsInputPlaceholder,
                      )}
                      onAddCommentSuccess={refetchCase}
                      onUpdateStatusSuccess={refetchCase}
                      currentStatus={activeCase.activeCase.communicationStatus}
                    />
                  ),
                },
                {
                  id: 'external',
                  label: formatMessage(messages.comments.externalComments),
                  content: (
                    <AddCommentTab
                      caseId={activeCase.activeCase.id}
                      internal={false}
                      userId={activeCase.activeCase.assignedTo.id}
                      inputPlaceholder={formatMessage(
                        messages.comments.externalCommentInputPlaceholder,
                      )}
                      onAddCommentSuccess={refetchCase}
                      onUpdateStatusSuccess={refetchCase}
                      currentStatus={activeCase.activeCase.communicationStatus}
                    />
                  ),
                },
              ]}
              label={''}
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}
