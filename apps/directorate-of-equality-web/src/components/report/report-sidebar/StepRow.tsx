'use client'

import cn from 'classnames'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { ReportTimelineItemDto, UserDto } from '../../../gen/fetch'
import * as styles from './ReportFormStepper.css'
import { TimelineItem } from './TimelineItem'

type Props = {
  label: string
  index: number
  isActive: boolean
  isComplete: boolean
  isLast: boolean
  isCollapsed: boolean
  stepItems: ReportTimelineItemDto[]
  usersById: Map<string, UserDto>
  companyName?: string | null
  onToggle: () => void
}

export function StepRow({
  label,
  index,
  isActive,
  isComplete,
  isLast,
  isCollapsed,
  stepItems,
  usersById,
  companyName,
  onToggle,
}: Props) {
  const hasItems = stepItems.length > 0
  const circleVariant = isActive ? 'active' : isComplete ? 'complete' : 'next'

  return (
    <div className={styles.stepRow}>
      <div className={styles.indicatorColumn}>
        <div
          className={cn(styles.circle, styles.circleVariants[circleVariant])}
          onClick={hasItems ? onToggle : undefined}
        >
          {isComplete ? (
            <Icon icon="checkmark" color="white" size="small" />
          ) : (
            index + 1
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              styles.connectingLine,
              styles.connectingLineVariants[isComplete ? 'complete' : 'incomplete'],
            )}
          />
        )}
      </div>

      <Box className={styles.contentColumn} paddingBottom={isLast ? 0 : 2}>
        <div
          className={cn(styles.titleRow, hasItems && styles.titleRowClickable)}
          onClick={hasItems ? onToggle : undefined}
        >
          <Text fontWeight={isActive ? 'semiBold' : 'light'}>{label}</Text>
        </div>

        {hasItems && (
          <div
            className={cn(
              styles.collapseWrapper,
              styles.collapseWrapperVariants[isCollapsed ? 'closed' : 'open'],
            )}
          >
            <div className={styles.collapseInner}>
              <Box paddingBottom={1} paddingTop={1}>
                {stepItems.map((item) => (
                  <TimelineItem
                    key={item.createdAt}
                    item={item}
                    usersById={usersById}
                    companyName={companyName}
                  />
                ))}
              </Box>
            </div>
          </div>
        )}
      </Box>
    </div>
  )
}
