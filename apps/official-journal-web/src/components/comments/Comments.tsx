import { Fragment, useMemo, useState } from 'react'
import AnimateHeight from 'react-animate-height'

import { Box, Button, Icon, Tabs, Tag, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useCase, useDeleteComment } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { APIRotues, COMMENTS_TO_HIDE } from '../../lib/constants'
import { commentToNode, getCommentIcon } from '../../lib/utils'
import { AddCommentTab } from './AddCommentTab'
import * as styles from './Comments.css'
import { messages } from './messages'
type Props = {
  activeCase: Case
  onAddCommentSuccess?: () => void
}

export const Comments = ({ activeCase, onAddCommentSuccess }: Props) => {
  const { formatMessage } = useFormatMessage()

  const [expanded, setExpanded] = useState(activeCase.comments.length < 6)
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [hiddenComments, setHiddenComments] = useState(false)

  const { mutate: refetchCase, isLoading: isRefetchingCase } = useCase({
    caseId: activeCase.id,
  })
  const { trigger: onDeleteComment, isMutating: isDeletingComment } =
    useDeleteComment({
      basePath: APIRotues.DeleteComment.replace(':id', activeCase.id),
      options: {
        onSuccess: () => {
          const currentCommentCount = activeCase.comments.length - 1
          if (currentCommentCount <= COMMENTS_TO_HIDE) {
            setExpanded(true)
          }

          refetchCase()
        },
      },
    })

  const isLoading = isRefetchingCase || isDeletingComment

  const sortedComments = useMemo(() => {
    return activeCase.comments.sort((a, b) => {
      if (order === 'asc') {
        return new Date(a.ageIso).getTime() - new Date(b.ageIso).getTime()
      } else {
        return new Date(b.ageIso).getTime() - new Date(a.ageIso).getTime()
      }
    })
  }, [activeCase.comments, order])

  return (
    <Box borderRadius="large" padding={[2, 3, 5]} background="purple100">
      <Box display="flex" justifyContent="spaceBetween" alignItems="center">
        <Text variant="h5">{formatMessage(messages.comments.title)}</Text>

        <Box
          display="flex"
          flexDirection="row"
          columnGap="gutter"
          rowGap="gutter"
        >
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

          <button
            className={styles.orderButton({ order: order })}
            onClick={() =>
              setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
          >
            <Icon icon="arrowUp" color="blue400" size="medium" />
          </button>
        </Box>
      </Box>
      <AnimateHeight duration={450} height={hiddenComments ? 0 : 'auto'}>
        {sortedComments.length === 0 ? (
          <Text>Engar athugasemdir fundust fyrir þetta mál</Text>
        ) : (
          sortedComments.map((c, i) => {
            if (
              !expanded &&
              i !== 0 &&
              i < sortedComments.length - COMMENTS_TO_HIDE
            ) {
              return null
            }

            return (
              <Fragment key={c.id}>
                <Box
                  display="flex"
                  flexDirection="column"
                  rowGap={1}
                  padding={[1, 2, 3]}
                  borderBottomWidth="standard"
                  borderColor="purple200"
                >
                  <Box
                    display="flex"
                    justifyContent="spaceBetween"
                    alignItems="center"
                  >
                    <Icon
                      icon={getCommentIcon(c)}
                      color="purple400"
                      size="medium"
                      className={styles.icon}
                    />

                    <div className={styles.text}>
                      <Text>{commentToNode(c)}</Text>
                      {c.comment ? <Text>{c.comment}</Text> : null}
                    </div>
                    <Text whiteSpace="nowrap">{c.age}</Text>
                  </Box>
                  <Box display="flex" justifyContent="spaceBetween">
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
                    <Box>
                      <Tag variant={c.internal ? 'mint' : 'darkerBlue'}>
                        {formatMessage(
                          c.internal
                            ? messages.comments.internalComment
                            : messages.comments.externalComment,
                        )}
                      </Tag>
                    </Box>
                  </Box>
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
                      {activeCase.comments.length - COMMENTS_TO_HIDE})
                    </Button>
                  </Box>
                ) : null}
              </Fragment>
            )
          })
        )}

        {activeCase.assignedTo && (
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
                        caseId={activeCase.id}
                        internal={true}
                        userId={activeCase.assignedTo.id}
                        inputPlaceholder={formatMessage(
                          messages.comments.internalCommentsInputPlaceholder,
                        )}
                        onAddCommentSuccess={() => {
                          refetchCase()
                          onAddCommentSuccess && onAddCommentSuccess()
                        }}
                        onUpdateStatusSuccess={refetchCase}
                        currentStatus={activeCase.communicationStatus}
                      />
                    ),
                  },
                  {
                    id: 'external',
                    label: formatMessage(messages.comments.externalComments),
                    content: (
                      <AddCommentTab
                        caseId={activeCase.id}
                        internal={false}
                        userId={activeCase.assignedTo.id}
                        inputPlaceholder={formatMessage(
                          messages.comments.externalCommentInputPlaceholder,
                        )}
                        onAddCommentSuccess={refetchCase}
                        onUpdateStatusSuccess={refetchCase}
                        currentStatus={activeCase.communicationStatus}
                      />
                    ),
                  },
                ]}
                label={''}
              />
            </Box>
          </Box>
        )}
      </AnimateHeight>
    </Box>
  )
}
