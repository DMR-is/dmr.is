'use client'

import { Select } from '@dmr.is/ui/components/island-is/Select'

import { ReportStatusEnum } from '../../../gen/fetch'
import { ReportStatusTranslatedEnum } from '../../../lib/constants'
import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  reportId: string
  status: ReportStatusEnum
  // admin?: string  // not yet available from API — enable once wired up
}

type Option = { value: ReportStatusEnum; label: string }

const TRANSITIONS: Partial<Record<ReportStatusEnum, Option[]>> = {
  [ReportStatusEnum.SUBMITTED]: [
    { value: ReportStatusEnum.IN_REVIEW, label: ReportStatusTranslatedEnum.IN_REVIEW },
  ],
  [ReportStatusEnum.IN_REVIEW]: [
    { value: ReportStatusEnum.APPROVED, label: ReportStatusTranslatedEnum.APPROVED },
    { value: ReportStatusEnum.DENIED, label: ReportStatusTranslatedEnum.DENIED },
  ],
}

export const ReportStatusSelect = ({ reportId, status }: Props) => {
  // const hasAdmin = !!admin  // uncomment once admin is available from API
  const hasAdmin = true // temporary until admin is wired up
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.reports.getById.queryKey() })

  const assign = useMutation({
    ...trpc.reportWorkflow.assign.mutationOptions(),
    onSuccess: invalidate,
  })

  const approve = useMutation({
    ...trpc.reportWorkflow.approve.mutationOptions(),
    onSuccess: invalidate,
  })

  const deny = useMutation({
    ...trpc.reportWorkflow.deny.mutationOptions(),
    onSuccess: invalidate,
  })

  const isLoading = assign.isPending || approve.isPending || deny.isPending

  const currentOption: Option = { value: status, label: ReportStatusTranslatedEnum[status] }
  const options = TRANSITIONS[status] ?? []

  const handleChange = (opt: Option | null) => {
    if (!opt) return
    if (opt.value === ReportStatusEnum.IN_REVIEW) {
      assign.mutate({ reportId })
    } else if (opt.value === ReportStatusEnum.APPROVED) {
      approve.mutate({ reportId })
    } else if (opt.value === ReportStatusEnum.DENIED) {
      // TODO: replace prompt with a proper denial reason dialog
      const denialReason = window.prompt('Ástæða höfnunar')
      if (!denialReason) return
      deny.mutate({ reportId, denialReason })
    }
  }

  return (
    <Select
      size="sm"
      label="Staða"
      options={options}
      value={currentOption}
      isDisabled={!hasAdmin || options.length === 0}
      isLoading={isLoading}
      onChange={(opt) => handleChange(opt as Option | null)}
    />
  )
}
