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

import { Case, CaseCommentTypeEnum } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { commentTaskToNode } from '../../lib/utils'
import * as styles from './Comments.css'
import { messages } from './messages'

type Props = {
  activeCase: Case
}

export const Comments = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()
  const [expanded, setExpanded] = useState(activeCase.comments.length < 5)
  const [commentValue, setCommentValue] = useState('')
  const [internalComment, setInternalComment] = useState(false)
  const now = new Date()

  const addComment = () => {
    const post = async () => {
      const data = await fetch('/api/addComment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: activeCase.id,
          comment: commentValue,
          internal: internalComment,
          type: CaseCommentTypeEnum.Comment,
          from: 'Jón Bjarni',
        }),
      })

      const json = await data.json()

      console.log(json)
    }

    post()
    // setCommentValue('')
  }

  return (
    <Box borderRadius="large" padding={[2, 3, 5]} background="purple100">
      <Text variant="h5">{formatMessage(messages.comments.title)}</Text>

      {activeCase.comments.map((c, i) => {
        const daysAgo = differenceInCalendarDays(now, new Date(c.createdAt))
        const suffix =
          String(daysAgo).slice(-1) === '1'
            ? formatMessage(messages.comments.day)
            : formatMessage(messages.comments.days)

        if (!expanded && i !== 0 && i < activeCase.comments.length - 4) {
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
                  {activeCase.comments.length - 5})
                </Button>
              </Box>
            ) : null}
          </Fragment>
        )
      })}

      {activeCase.assignedTo && (
        <Box marginTop={2}>
          <Stack space={2}>
            <Input
              type="text"
              name="comment"
              label={formatMessage(messages.comments.label)}
              placeholder={formatMessage(messages.comments.placeholder)}
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              textarea
            />
            <Button disabled={!commentValue} onClick={addComment}>
              {formatMessage(messages.comments.save)}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  )
}
