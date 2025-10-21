import { Box, Stack } from '@dmr.is/ui/components/island-is'

import { CommentDto } from '../../gen/fetch'
import { commentMapper } from '../../mappers/commentMapper'
import { Comment } from '../comments/Comment'

type Props = {
  id: string
  comments: CommentDto[]
}

export const CommentFields = ({ id, comments }: Props) => {
  return (
    <Box padding={4} background="blue100" borderRadius="large">
      <Stack space={[1, 2]}>
        {comments.map((comment, index) => {
          const mapped = commentMapper(comment)
          return <Comment key={index} {...mapped} />
        })}
      </Stack>
    </Box>
  )
}
