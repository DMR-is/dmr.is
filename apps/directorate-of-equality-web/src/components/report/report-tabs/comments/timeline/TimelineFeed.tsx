'use client'

import React, { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'

import { Divider } from '@island.is/island-ui/core'

import { ReportTimelineItemDto } from '../../../../../gen/fetch'
import { reportText } from '../../../../../lib/text'
import { TimelineEntry } from './TimelineEntry'

const HEAD_COUNT = 3
const TAIL_COUNT = 3
const COLLAPSE_THRESHOLD = HEAD_COUNT + TAIL_COUNT

type Props = {
  timeline: ReportTimelineItemDto[]
  companyName?: string | null
  currentUserId?: string | null
  onDelete: (commentId: string) => void
}

function entryKey(item: ReportTimelineItemDto, i: number) {
  return `${item.kind}-${item.comment?.id ?? item.event?.id}-${i}`
}

export function TimelineFeed({
  timeline,
  companyName,
  currentUserId,
  onDelete,
}: Props) {
  const [showAll, setShowAll] = useState(false)

  if (timeline.length === 0) return null

  const shouldCollapse = !showAll && timeline.length > COLLAPSE_THRESHOLD
  const head = shouldCollapse ? timeline.slice(0, HEAD_COUNT) : []
  const tail = shouldCollapse ? timeline.slice(-TAIL_COUNT) : []
  const hiddenCount = shouldCollapse
    ? timeline.length - HEAD_COUNT - TAIL_COUNT
    : 0

  const renderEntry = (item: ReportTimelineItemDto, i: number) => (
    <TimelineEntry
      key={entryKey(item, i)}
      item={item}
      companyName={companyName}
      currentUserId={currentUserId}
      onDelete={onDelete}
    />
  )

  const renderList = (items: ReportTimelineItemDto[], offset = 0) =>
    items.map((item, i) => (
      <React.Fragment key={entryKey(item, offset + i)}>
        {i > 0 && <Divider />}
        {renderEntry(item, offset + i)}
      </React.Fragment>
    ))

  if (shouldCollapse) {
    return (
      <Box display="flex" flexDirection="column">
        {renderList(head)}
        <Divider />
        <Box paddingY={3} marginLeft={7}>
          <Button variant="text" size="small" onClick={() => setShowAll(true)}>
            {reportText.comments.seeAllComments} ({hiddenCount})
          </Button>
        </Box>
        <Divider />
        {renderList(tail, timeline.length - TAIL_COUNT)}
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column">
      {renderList(timeline)}
    </Box>
  )
}
