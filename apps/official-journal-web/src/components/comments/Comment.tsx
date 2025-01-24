import {
  Box,
  Button,
  Icon,
  Inline,
  Stack,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { CaseComment } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { parseComment } from '../../lib/utils'
import * as styles from './Comment.css'
import { messages } from './messages'

type Props = {
  comment: CaseComment
}

export const Comment = ({ comment }: Props) => {
  const { formatMessage } = useFormatMessage()
  const { title, icon, internal } = parseComment(comment)

  const canDelete = false

  return (
    <Box className={styles.commentWrapper}>
      <Box className={styles.iconWrapper}>
        <Icon color="blue400" icon={icon} type="outline" />
      </Box>
      <Box className={styles.content}>
        <Stack space={1}>
          {title}
          {comment.comment && <Text>{comment.comment}</Text>}
        </Stack>
      </Box>
      <Box className={styles.date}>
        <Text capitalizeFirstLetter whiteSpace="nowrap">
          {comment.age}
        </Text>
      </Box>
      {canDelete ||
        (!internal && (
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
              {!internal && (
                <Tag outlined variant="blue">
                  {formatMessage(messages.comments.externalComment)}
                </Tag>
              )}
            </Inline>
          </Box>
        ))}
    </Box>
  )
}
