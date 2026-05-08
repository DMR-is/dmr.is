'use client'

import React from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Divider } from '@island.is/island-ui/core'

import { ReportCommentDto } from '../../../gen/fetch'
import { formatDateIS } from '../../../lib/constants'

type Props = {
  comments: ReportCommentDto[]
  body: string
  isExternal: boolean
  isPending: boolean
  onBodyChange: (value: string) => void
  onExternalChange: (value: boolean) => void
  onSubmit: () => void
}

export const CommentsForm = ({
  comments,
  body,
  isExternal,
  isPending,
  onBodyChange,
  onExternalChange,
  onSubmit,
}: Props) => {
  return (
    <>
      <Text variant="h4" marginBottom={4}>
        Athugasemdir
      </Text>
      <Box
        display="flex"
        flexDirection="column"
        rowGap={4}
        background="blue100"
        padding={4}
        borderRadius="large"
      >
        {comments.length > 0 && (
          <Box display="flex" flexDirection="column">
            {comments.map((c, i) => (
              <React.Fragment key={c.id}>
                <Box
                  display="flex"
                  justifyContent="spaceBetween"
                  marginBottom={1}
                >
                  <Text variant="medium" fontWeight="medium">
                    {c.authorKind}
                  </Text>
                  <Text variant="medium" color="dark400">
                    {new Date(c.createdAt).toDateString() ===
                    new Date().toDateString()
                      ? 'Í dag'
                      : formatDateIS(c.createdAt)}
                  </Text>
                </Box>
                <Text>{c.body}</Text>
                {i < comments.length - 1 && (
                  <Box paddingY={4}>
                    <Divider />
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Box>
        )}

        <Input
          name="comment"
          label="Athugasemd"
          placeholder="Bættu við athugasemd"
          textarea
          rows={5}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
        />
        <Checkbox
          label="Senda á innsendanda"
          checked={isExternal}
          onChange={(e) => onExternalChange(e.target.checked)}
        />
        <Box alignSelf="flexEnd">
          <Button
            onClick={onSubmit}
            loading={isPending}
            disabled={!body.trim()}
          >
            Vista athugasemd
          </Button>
        </Box>
      </Box>
    </>
  )
}
