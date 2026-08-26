'use client'

import { Select } from '@dmr.is/ui/components/island-is/Select'

import {
  useAssignReviewer,
  useReviewerOptions,
} from '../../../hooks/useReviewers'
import { reportText } from '../../../lib/text'

type Props = {
  reportId: string
  assignedUserId?: string | null
  disabled?: boolean
}

export const EmployeeSelect = ({
  reportId,
  assignedUserId,
  disabled,
}: Props) => {
  const { options, isLoading: isLoadingUsers } = useReviewerOptions()
  const assign = useAssignReviewer(reportId)

  const value = options.find((o) => o.value === assignedUserId) ?? null

  return (
    <Select
      size="sm"
      label={reportText.employeeSelect.label}
      options={options}
      value={value}
      isClearable
      isLoading={isLoadingUsers || assign.isPending}
      isDisabled={disabled}
      onChange={(opt) =>
        assign.mutate({
          reportId,
          userId: opt?.value ?? null,
          // `updateStatus: false` — picking a reviewer here is bookkeeping, not
          // the report being taken on. The "Færa í vinnslu" button in
          // `ReportStatusSelect` owns the SUBMITTED → IN_REVIEW transition, and
          // it would be surprising for a dropdown labelled "Starfsmaður" to
          // move the report through the pipeline as a side effect.
          updateStatus: false,
        })
      }
    />
  )
}
