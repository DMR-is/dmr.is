'use client'

import { useMemo } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { InlineSelect } from '@dmr.is/ui/components/island-is/InlineSelect'

import { ReportStatusEnum } from '../../gen/fetch/types.gen'
import { useAssignReviewer, useReviewerOptions } from '../../hooks/useReviewers'
import { overviewText } from '../../lib/text'

type Props = {
  reportId: string
  status: ReportStatusEnum
  reviewerId: string | null
  /** The assigned reviewer's name, as the list reported it. */
  reviewerName: string
}

/**
 * Reviewer assignment straight from the overview table, so the admin does not
 * have to open a report just to hand it to someone.
 *
 * Assigns with `updateStatus: false`: handing a report to a colleague from the
 * list is not the same as that colleague picking it up, so the report keeps its
 * status and stays on whichever tab it was on. Moving it into review is the
 * explicit "Færa í vinnslu" action on the report itself.
 *
 * The API only accepts assignment on SUBMITTED and IN_REVIEW. Every other
 * status — POSTPONED included, which the first tab shows when "sýna frestaðar"
 * is on — would 400, so those rows render the plain name instead of a select
 * that is guaranteed to fail.
 */
export const ReportReviewerSelect = ({
  reportId,
  status,
  reviewerId,
  reviewerName,
}: Props) => {
  const isAssignable =
    status === ReportStatusEnum.SUBMITTED ||
    status === ReportStatusEnum.IN_REVIEW

  const { options: reviewerOptions, isLoading: isLoadingUsers } =
    useReviewerOptions({ enabled: isAssignable })

  const assign = useAssignReviewer(reportId)

  // The row already knows who is assigned; the options list may not. It arrives
  // after first paint, and never contains a reviewer who has since been
  // deactivated. Falling back to the name from the list keeps the cell from
  // reading "Óúthlutað" over a real assignment — which matters here, because
  // the cell is also the control an admin would reassign from.
  const options = useMemo(() => {
    if (!reviewerId || reviewerOptions.some((o) => o.value === reviewerId)) {
      return reviewerOptions
    }
    return [...reviewerOptions, { value: reviewerId, label: reviewerName }]
  }, [reviewerOptions, reviewerId, reviewerName])

  // The cell already carries the table's text styles, so the name goes in bare.
  if (!isAssignable) return <>{reviewerName}</>

  return (
    // The table navigates to the report on any cell click, which would tear the
    // dropdown down mid-interaction — the click has to stop here. (The menu
    // itself is portaled out of the table, so it never bubbles into the row.)
    <Box
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      style={{ cursor: 'auto' }}
    >
      <InlineSelect
        name={`report-reviewer-${reportId}`}
        aria-label={overviewText.reviewerSelect.label}
        options={options}
        value={reviewerId}
        placeholder={overviewText.reviewerSelect.placeholder}
        isClearable
        isLoading={isLoadingUsers || assign.isPending}
        onChange={(userId) =>
          assign.mutate({ reportId, userId, updateStatus: false })
        }
      />
    </Box>
  )
}
