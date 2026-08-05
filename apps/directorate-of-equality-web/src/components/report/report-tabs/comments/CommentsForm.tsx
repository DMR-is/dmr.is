'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { ReportTimelineItemDto } from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { TimelineFeed } from './timeline/TimelineFeed'
import { CommentInputForm } from './CommentInputForm'

type Props = {
  timeline: ReportTimelineItemDto[]
  companyName?: string | null
  currentUserId?: string | null
  readonly?: boolean
  canSendExternal?: boolean
  body: string
  isExternal: boolean
  isPending: boolean
  onBodyChange: (value: string) => void
  onExternalChange: (value: boolean) => void
  onSubmit: () => void
  onDelete: (commentId: string) => void
}

export const CommentsForm = ({
  timeline,
  companyName,
  currentUserId,
  readonly = false,
  canSendExternal = false,
  body,
  isExternal,
  isPending,
  onBodyChange,
  onExternalChange,
  onSubmit,
  onDelete,
}: Props) => {
  return (
    <>
      <Text variant="h4" marginBottom={4}>
        {reportText.comments.heading}
      </Text>
      <Box
        display="flex"
        flexDirection="column"
        background="blue100"
        padding={4}
        borderRadius="large"
      >
        <TimelineFeed
          timeline={timeline}
          companyName={companyName}
          currentUserId={currentUserId}
          onDelete={onDelete}
        />

        {!readonly && (
          <Box marginTop={4}>
            <CommentInputForm
              body={body}
              isExternal={isExternal}
              canSendExternal={canSendExternal}
              isPending={isPending}
              onBodyChange={onBodyChange}
              onExternalChange={onExternalChange}
              onSubmit={onSubmit}
            />
          </Box>
        )}
      </Box>
    </>
  )
}
