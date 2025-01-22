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
import * as styles from './Comments.css'
import { messages } from './messages'
type Props = {
  onAddCommentSuccess?: () => void
  showHideButton?: boolean
}

export const Comments = ({ showHideButton, onAddCommentSuccess }: Props) => {
  const { formatMessage } = useFormatMessage()

  const { currentCase, refetch } = useCaseContext()
  const [expanded, setExpanded] = useState(currentCase.comments.length < 6)
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [hiddenComments, setHiddenComments] = useState(false)

  const { trigger: onDeleteComment, isMutating: isDeletingComment } =
    useDeleteComment({
      options: {
        onSuccess: () => {
          const currentCommentCount = currentCase.comments.length - 1
          if (currentCommentCount <= COMMENTS_TO_HIDE) {
            setExpanded(true)
          }

          refetch()
        },
      },
    })

  const sortedComments = useMemo(() => {
    return currentCase.comments.sort((a, b) => {
      if (order === 'asc') {
        return new Date(a.ageIso).getTime() - new Date(b.ageIso).getTime()
      } else {
        return new Date(b.ageIso).getTime() - new Date(a.ageIso).getTime()
      }
    })
  }, [currentCase.comments, order])

  return (
    <Box borderRadius="large" padding={[2, 3, 5]} background="blue100">
      <Stack space={2}>
        <Inline justifyContent="flexEnd" space={2} alignY="center">
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
        </Inline>
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
                        loading={isDeletingComment}
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
                        {currentCase.comments.length - COMMENTS_TO_HIDE})
                      </Button>
                    </Box>
                  ) : null}
                </Fragment>
              )
            })
          )}

          {currentCase.assignedTo && (
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
                          caseId={currentCase.id}
                          internal={true}
                          userId={currentCase.assignedTo.id}
                          inputPlaceholder={formatMessage(
                            messages.comments.internalCommentsInputPlaceholder,
                          )}
                          onAddCommentSuccess={() => {
                            refetch()
                            onAddCommentSuccess && onAddCommentSuccess()
                          }}
                          onUpdateStatusSuccess={refetch}
                          currentStatus={currentCase.communicationStatus}
                        />
                      ),
                    },
                    {
                      id: 'external',
                      label: formatMessage(messages.comments.externalComments),
                      content: (
                        <AddCommentTab
                          caseId={currentCase.id}
                          internal={false}
                          userId={currentCase.assignedTo.id}
                          inputPlaceholder={formatMessage(
                            messages.comments.externalCommentInputPlaceholder,
                          )}
                          onAddCommentSuccess={refetch}
                          onUpdateStatusSuccess={refetch}
                          currentStatus={currentCase.communicationStatus}
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
      </Stack>
    </Box>
  )
}
