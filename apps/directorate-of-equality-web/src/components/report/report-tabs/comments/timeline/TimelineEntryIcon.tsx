'use client'

import { theme } from '@dmr.is/island-ui-theme'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'

import { TimelineEntryKind } from './timelineHelpers'

type Props = {
  kind: TimelineEntryKind
}

export function TimelineEntryIcon({ kind }: Props) {
  const isEvent = kind === 'event'
  const isIncoming = kind === 'incoming'
  const isInternal = kind === 'internal'

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        flexShrink: 0,
        backgroundColor:
          isEvent || isInternal ? 'transparent' : theme.color.blue400,
        border:
          isEvent || isInternal ? `1px solid ${theme.color.blue400}` : 'none',
      }}
    >
      {isEvent ? (
        <Icon icon="checkmark" color="blue400" />
      ) : isIncoming ? (
        <Icon icon="arrowBack" color="white" />
      ) : isInternal ? (
        <Icon icon="pencil" color="blue400" />
      ) : (
        <Icon icon="arrowForward" color="white" />
      )}
    </Box>
  )
}
