import { Box, Button, Icon, Inline, Tag, Text } from '@island.is/island-ui/core'

import { CaseActionEnum, CommentDto } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { commentToNode, convertDateToDaysAgo } from '../../lib/utils'
import * as styles from './Comment.css'
import { messages } from './messages'

type Props = {
  comment: CommentDto
}

export const Comment = ({ comment }: Props) => {
  const { formatMessage } = useFormatMessage()
  const commentNode = commentToNode(comment)

  const canDelete = false
  const showFooter =
    canDelete || comment.action === CaseActionEnum.EXTERNALCOMMENT

  return (
    <Box className={styles.commentWrapper}>
      <Box className={styles.iconWrapper}>
        <Icon
          color="blue400"
          icon={
            comment.action === CaseActionEnum.EXTERNALCOMMENT
              ? 'arrowBack'
              : 'arrowForward'
          }
          type="outline"
        />
      </Box>
      <Box className={styles.content}>{commentNode}</Box>
      <Box className={styles.date}>
        <Text capitalizeFirstLetter whiteSpace="nowrap">
          {convertDateToDaysAgo(comment.created, true)}
        </Text>
      </Box>
      {showFooter && (
        <Box className={styles.actions}>
          <Inline
            space={2}
            alignY="center"
            justifyContent={canDelete ? 'spaceBetween' : 'flexEnd'}
          >
            {canDelete && (
              <Button
                variant="text"
                icon="trash"
                iconType="outline"
                size="small"
              >
                {formatMessage(messages.comments.deleteComment)}
              </Button>
            )}
            {comment.action === CaseActionEnum.EXTERNALCOMMENT && (
              <Tag outlined variant="blue">
                {formatMessage(messages.comments.externalComment)}
              </Tag>
            )}
          </Inline>
        </Box>
      )}
    </Box>
  )
}
