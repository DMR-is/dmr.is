import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'
import { useState } from 'react'

import {
  Box,
  Button,
  Icon,
  Input,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { CaseComment, CaseCommentTypeEnum } from '../../gen/fetch'
import { commentTaskToNode } from '../../lib/utils'
import * as styles from './Comments.css'

type Props = {
  comments: CaseComment[]
}

export const Comments = ({ comments }: Props) => {
  const now = new Date()
  const [commentValue, setCommentValue] = useState('')

  return (
    <Box borderRadius="large" padding={[2, 3, 5]} background="purple100">
      <Text variant="h5">Athugasemdir</Text>
      {comments.map((c, i) => {
        const daysAgo = differenceInCalendarDays(now, new Date(c.createdAt))
        const suffix = String(daysAgo).slice(-1) === '1' ? 'degi' : 'dögum'
        return (
          <Box
            key={i}
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
            </div>

            <Text whiteSpace="nowrap">
              {daysAgo === 0
                ? 'Í dag'
                : daysAgo === 1
                ? 'Í gær'
                : 'f. ' + daysAgo + ' ' + suffix}
            </Text>
          </Box>
        )
      })}
      <Box marginTop={2}>
        <Stack space={2}>
          <Input
            type="text"
            name="comment"
            label="Athugasemd"
            placeholder="Bættu við athugasemd"
            value={commentValue}
            onChange={(e) => setCommentValue(e.target.value)}
            textarea
          />
          <Button disabled={!commentValue}>Vista athugasemd</Button>
        </Stack>
      </Box>
    </Box>
  )
}
