'use client'

import { useMemo } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { sharedText } from '../lib/text'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export type ReviewerOption = { value: string; label: string }

/** The one place a reviewer's display name is assembled. */
export const reviewerFullName = (reviewer: {
  firstName?: string | null
  lastName?: string | null
}) => `${reviewer.firstName ?? ''} ${reviewer.lastName ?? ''}`.trim()

/**
 * Assignable reviewers as select options.
 *
 * `user.list` is active-only, so a reviewer who has since been deactivated is
 * absent from this list. A caller that renders a *current* assignment has to
 * carry its own fallback label rather than trusting the list to contain it.
 */
export const useReviewerOptions = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  const trpc = useTRPC()

  // Always the same (empty) input, so every reviewer dropdown on a screen —
  // one per table row, on the overview — shares a single cache entry.
  const { data, isLoading } = useQuery(
    trpc.user.list.queryOptions(undefined, { enabled }),
  )

  const options = useMemo<ReviewerOption[]>(
    () =>
      (data ?? []).map((user) => ({
        value: user.id,
        label: reviewerFullName(user),
      })),
    [data],
  )

  return { options, isLoading }
}

/**
 * The reviewer assignment mutation, shared by the select in a report's sidebar
 * and the reviewer column on the overview: same endpoint, same invalidations,
 * same toasts.
 *
 * `updateStatus` is deliberately not defaulted here. Whether an assignment also
 * moves the report through the pipeline belongs to the control the user
 * touched, and it reads better stated at the call site than inherited.
 */
export const useAssignReviewer = (reportId: string) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.reportWorkflow.assign.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.reports.getById.queryKey({ id: reportId }),
      })
      // The list carries the tab counts as well as the row, so it goes whole.
      queryClient.invalidateQueries({ queryKey: trpc.reports.list.queryKey() })
      toast.success(sharedText.reviewerAssign.successToast)
    },
    onError: () => {
      toast.error(sharedText.reviewerAssign.errorToast)
    },
  })
}
