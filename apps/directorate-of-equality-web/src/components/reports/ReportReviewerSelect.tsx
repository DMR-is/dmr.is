'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { InlineSelect } from '@dmr.is/ui/components/island-is/InlineSelect'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { ReportStatusEnum } from '../../gen/fetch/types.gen'
import { overviewText, reportText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  reportId: string
  status: ReportStatusEnum
  reviewerId: string | null
  /** Name to fall back to when the row cannot be assigned from the list. */
  reviewerName: string
}

/**
 * Reviewer assignment straight from the overview table, so the admin does not
 * have to open a report just to hand it to someone.
 *
 * The API only accepts assignment on SUBMITTED (assign, which also moves the
 * report to IN_REVIEW) and IN_REVIEW (reassign, or clear to push it back to the
 * queue). Every other status — POSTPONED included, which the first tab shows
 * when "sýna frestaðar" is on — would 400, so those rows render the plain name
 * instead of a select that is guaranteed to fail.
 */
export const ReportReviewerSelect = ({
  reportId,
  status,
  reviewerId,
  reviewerName,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const isAssignable =
    status === ReportStatusEnum.SUBMITTED ||
    status === ReportStatusEnum.IN_REVIEW

  const { data: users, isLoading: isLoadingUsers } = useQuery(
    trpc.user.list.queryOptions(undefined, { enabled: isAssignable }),
  )

  const assign = useMutation({
    ...trpc.reportWorkflow.assign.mutationOptions(),
    onSuccess: () => {
      // The list itself carries both the row and the tab counts, and assigning
      // from the first tab flips the status, so the whole list is refetched.
      queryClient.invalidateQueries({ queryKey: trpc.reports.list.queryKey() })
      queryClient.invalidateQueries({
        queryKey: trpc.reports.getById.queryKey({ id: reportId }),
      })
      toast.success(reportText.employeeSelect.successToast)
    },
    onError: () => {
      toast.error(reportText.employeeSelect.errorToast)
    },
  })

  // The cell already carries the table's text styles, so the name goes in bare.
  if (!isAssignable) return <>{reviewerName}</>

  const options = (users ?? []).map((u) => ({
    label: `${u.firstName} ${u.lastName}`.trim(),
    value: u.id,
  }))

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
        aria-label={overviewText.filter.reviewerLabel}
        options={options}
        value={reviewerId}
        placeholder={overviewText.reviewerSelect.placeholder}
        // Clearing means "back to the queue", which the API only allows once the
        // report is in review.
        isClearable={status === ReportStatusEnum.IN_REVIEW}
        isLoading={isLoadingUsers || assign.isPending}
        onChange={(userId) => assign.mutate({ reportId, userId })}
      />
    </Box>
  )
}
