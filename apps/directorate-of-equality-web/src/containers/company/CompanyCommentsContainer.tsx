'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { TimelineFeed } from '../../components/report/report-tabs/comments/timeline/TimelineFeed'
import {
  ReportCommentDto,
  ReportRoleEnum,
  ReportStatusEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
} from '../../gen/fetch'
import { companiesText } from '../../lib/text'

const t = companiesText.detailView.comments

// Mocked until company comments API endpoint is available
const MOCK_INITIAL: ReportTimelineItemDto[] = []

export function CompanyCommentsContainer() {
  const [body, setBody] = useState('')
  const [comments, setComments] =
    useState<ReportTimelineItemDto[]>(MOCK_INITIAL)

  const handleSubmit = () => {
    if (!body.trim()) return

    const newComment: ReportCommentDto = {
      id: `local-${Date.now()}`,
      reportId: '',
      authorKind: ReportRoleEnum.REVIEWER,
      authorUserId: null,
      visibility: 'INTERNAL' as const,
      body: body.trim(),
      reportStatus: ReportStatusEnum.SUBMITTED,
      createdAt: new Date().toISOString(),
    }

    const newEntry: ReportTimelineItemDto = {
      kind: ReportTimelineItemKindEnum.COMMENT,
      createdAt: newComment.createdAt,
      comment: newComment,
    }

    setComments((prev) => [...prev, newEntry])
    setBody('')
  }

  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((item) => item.comment?.id !== commentId))
  }

  return (
    <>
      <Text variant="h4" marginBottom={4}>
        {t.heading}
      </Text>
      <Box
        display="flex"
        flexDirection="column"
        background="blue100"
        padding={4}
        borderRadius="large"
      >
        {comments.length > 0 && (
          <Box marginBottom={4}>
            <TimelineFeed
              timeline={comments}
              usersById={new Map()}
              currentUserId={undefined}
              onDelete={handleDelete}
            />
          </Box>
        )}
        <Box display="flex" flexDirection="column" rowGap={3}>
          <Input
            name="company-comment"
            label={t.label}
            placeholder={t.placeholder}
            textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Box alignSelf="flexEnd">
            <Button onClick={handleSubmit} disabled={!body.trim()}>
              {t.submit}
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  )
}
