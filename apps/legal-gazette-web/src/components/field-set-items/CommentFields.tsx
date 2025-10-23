'use client'

import { useMemo, useState } from 'react'

import { Box, Button, Inline, Stack } from '@dmr.is/ui/components/island-is'

import { useSuspenseQuery, useTRPC } from '../../lib/nTrpc/client/trpc'
import { commentMapper } from '../../mappers/commentMapper'
import { AddComment } from '../comments/AddComment'
import { Comment } from '../comments/Comment'

type Props = {
  id: string
}

export const CommentFields = ({ id }: Props) => {
  const trpc = useTRPC()
  const { data: advert } = useSuspenseQuery(trpc.getAdvert.queryOptions({ id }))
  const comments = advert.comments

  const [order, setOrder] = useState<'asc' | 'desc'>('asc')

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return order === 'asc' ? dateA - dateB : dateB - dateA
    })
  }, [order, comments])

  return (
    <Box padding={4} background="blue100" borderRadius="large">
      <Stack space={[2, 4]} dividers>
        <Inline align="right">
          <Button
            onClick={() =>
              setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            circle
            icon={order === 'asc' ? 'arrowDown' : 'arrowUp'}
            variant="ghost"
          />
        </Inline>
        {sortedComments.map((comment, index) => {
          const mapped = commentMapper(comment)
          return <Comment key={index} {...mapped} />
        })}
        <AddComment advertId={id} />
      </Stack>
    </Box>
  )
}
