import { Box } from '@island.is/island-ui/core'

import { CommentList } from './CommentList'

export const Comments = () => {
  return (
    <Box
      borderRadius="large"
      paddingTop={0}
      padding={[2, 3, 5]}
      background="blue100"
    >
      <CommentList />
    </Box>
  )
}
