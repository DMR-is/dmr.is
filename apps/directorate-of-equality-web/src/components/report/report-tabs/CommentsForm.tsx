'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { ReportTimelineItemDto, UserDto } from '../../../gen/fetch'
import { CommentInputForm } from './CommentInputForm'
import { TimelineFeed } from './TimelineFeed'

type Props = {
  timeline: ReportTimelineItemDto[]
  usersById: Map<string, UserDto>
  companyName?: string | null
  currentUserId?: string | null
  readonly?: boolean
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
  usersById,
  companyName,
  currentUserId,
  readonly = false,
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
        Athugasemdir
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
          usersById={usersById}
          companyName={companyName}
          currentUserId={currentUserId}
          onDelete={onDelete}
        />

        {!readonly && (
          <Box marginTop={4}>
            <CommentInputForm
              body={body}
              isExternal={isExternal}
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
