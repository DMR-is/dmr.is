'use client'

import React from 'react'

import { Select } from '@dmr.is/ui/components/island-is/Select'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { ReportStatusEnum } from '../../../gen/fetch'
import { ReportStatusTranslatedEnum } from '../../../lib/constants'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { ReportDenialModal } from './ReportDenialModal'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  reportId: string
  status: ReportStatusEnum
}

type Option = { value: ReportStatusEnum; label: string }

const TRANSITIONS: Partial<Record<ReportStatusEnum, Option[]>> = {
  [ReportStatusEnum.SUBMITTED]: [
    {
      value: ReportStatusEnum.IN_REVIEW,
      label: ReportStatusTranslatedEnum.IN_REVIEW,
    },
  ],
  [ReportStatusEnum.IN_REVIEW]: [
    {
      value: ReportStatusEnum.APPROVED,
      label: ReportStatusTranslatedEnum.APPROVED,
    },
    {
      value: ReportStatusEnum.DENIED,
      label: ReportStatusTranslatedEnum.DENIED,
    },
  ],
}

export const ReportStatusSelect = ({ reportId, status }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const onSuccess = () => () => toast.success('Uppfærsla á stöðu tókst.')

  const onError = () => () =>
    toast.error('Villa við að uppfæra stöðu. Vinsamlegast reyndu aftur síðar.')

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.reports.getById.queryKey({ id: reportId }),
    })
    queryClient.invalidateQueries({
      queryKey: trpc.reports.list.queryKey(),
    })
  }

  const assign = useMutation({
    ...trpc.reportWorkflow.assign.mutationOptions(),
    onSuccess: () => {
      invalidate()
      onSuccess()
    },
    onError: onError(),
  })

  const approve = useMutation({
    ...trpc.reportWorkflow.approve.mutationOptions(),
    onSuccess: () => {
      invalidate()
      onSuccess()
    },
    onError: onError(),
  })

  const deny = useMutation({
    ...trpc.reportWorkflow.deny.mutationOptions(),
    onSuccess: () => {
      invalidate()
      onSuccess()
      setIsModalOpen(false)
    },
    onError: onError(),
  })

  const isLoading = assign.isPending || approve.isPending || deny.isPending

  const currentOption: Option = {
    value: status,
    label: ReportStatusTranslatedEnum[status],
  }
  const options = TRANSITIONS[status] ?? []

  const handleChange = (opt: Option | null) => {
    if (!opt) return
    if (opt.value === ReportStatusEnum.IN_REVIEW) {
      assign.mutate({ reportId })
    } else if (opt.value === ReportStatusEnum.APPROVED) {
      approve.mutate({ reportId })
    } else if (opt.value === ReportStatusEnum.DENIED) {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <Select
        size="sm"
        label="Staða"
        options={options}
        value={currentOption}
        isLoading={isLoading}
        onChange={(opt) => handleChange(opt as Option | null)}
      />
      <ReportDenialModal
        visible={isModalOpen}
        isLoading={deny.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(denialReason) => deny.mutate({ reportId, denialReason })}
      />
    </>
  )
}
