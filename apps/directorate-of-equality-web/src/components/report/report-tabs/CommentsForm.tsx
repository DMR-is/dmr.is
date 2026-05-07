'use client'

import { useState } from 'react'
import React from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Divider } from '@island.is/island-ui/core'

import { CommentVisibilityEnum } from '../../../gen/fetch/types.gen'
import { formatDateIS } from '../../../lib/constants'
import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  reportId: string
}

export const CommentsForm = ({ reportId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const [isExternal, setIsExternal] = useState(false)

  const { data: comments = [] } = useQuery(
    trpc.reportComments.list.queryOptions({ reportId }),
  )

  const { mutate: createComment, isPending } = useMutation({
    ...trpc.reportComments.create.mutationOptions(),
    onSuccess: () => {
      setBody('')
      setIsExternal(false)
      queryClient.invalidateQueries({
        queryKey: trpc.reportComments.list.queryKey({ reportId }),
      })
    },
  })

  const handleSubmit = () => {
    if (!body.trim()) return
    createComment({
      reportId,
      body,
      visibility: isExternal
        ? CommentVisibilityEnum.EXTERNAL
        : CommentVisibilityEnum.INTERNAL,
    })
  }

  return (
    <>
    <Text variant="h4" marginBottom={4}>Athugasemdir</Text>
    <Box display="flex" flexDirection="column" rowGap={4} background="blue100" padding={4} borderRadius="large">
      {comments.length > 0 && (
        <Box display="flex" flexDirection="column" >
          {comments.map((c, _i) => (
            <React.Fragment key={c.id}>
              <Box display="flex" justifyContent="spaceBetween" marginBottom={1}>
                <Text variant="medium" fontWeight='medium'>{c.authorKind}</Text>
                <Text variant="medium" color="dark400">
                 {new Date(c.createdAt).toDateString() === new Date().toDateString() ? 'Í dag' : formatDateIS(c.createdAt)}
                </Text>

            </Box>
              <Text>{c.body}</Text>

            {_i < comments.length - 1 && <Box paddingY={4}>
              <Divider />
              </Box>
              }
            </React.Fragment>
          ))}
        </Box>
      )}

      <Input
        name="comment"
        label="Athugasemd"
        placeholder='Bættu við athugasemd'
        textarea
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Checkbox
        label="Senda á innsendanda"
        checked={isExternal}
        onChange={(e) => setIsExternal(e.target.checked)}
      />
      <Box alignSelf={'flexEnd'}>
        <Button onClick={handleSubmit} loading={isPending} disabled={!body.trim()}>
          Vista athugasemd
        </Button>
      </Box>
    </Box>
    </>
  )
}
