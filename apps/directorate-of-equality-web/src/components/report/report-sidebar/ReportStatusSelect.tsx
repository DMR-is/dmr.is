'use client'

import React from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { ReportStatusEnum } from '../../../gen/fetch'
import { ReportStatusTranslatedEnum } from '../../../lib/constants'
import { reportText, sharedText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { ReportDenialModal } from './ReportDenialModal'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  reportId: string
  status: ReportStatusEnum
  disabled?: boolean
}

export const ReportStatusSelect = ({ reportId, status, disabled }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.reports.getById.queryKey({ id: reportId }),
    })
    queryClient.invalidateQueries({
      queryKey: trpc.reports.list.queryKey(),
    })
  }

  const onSuccess = () => toast.success(reportText.statusSelect.successToast)
  const onError = () => toast.error(reportText.statusSelect.errorToast)

  const assign = useMutation({
    ...trpc.reportWorkflow.assign.mutationOptions(),
    onSuccess: () => {
      invalidate()
      onSuccess()
    },
    onError,
  })

  const approve = useMutation({
    ...trpc.reportWorkflow.approve.mutationOptions(),
    onSuccess: () => {
      invalidate()
      onSuccess()
    },
    onError,
  })

  const deny = useMutation({
    ...trpc.reportWorkflow.deny.mutationOptions(),
    onSuccess: () => {
      invalidate()
      onSuccess()
      setIsModalOpen(false)
    },
    onError,
  })

  const isLoading = assign.isPending || approve.isPending || deny.isPending
  const isInReview = status === ReportStatusEnum.IN_REVIEW
  const isSubmitted = status === ReportStatusEnum.SUBMITTED
  // A POSTPONED report can be denied (to unblock the company when postponed
  // outliers are never resolved) but not approved — approval requires the
  // outlier explanations to be complete, which POSTPONED by definition lacks.
  const canDeny = isInReview || status === ReportStatusEnum.POSTPONED

  return (
    <>
      <Stack space={2}>
        <Box background="white" borderRadius="large">
          <Input
            name="report-status"
            readOnly
            value={ReportStatusTranslatedEnum[status]}
            size="sm"
            label={sharedText.statusLabel}
          />
        </Box>

        {isSubmitted && (
          <Button
            fluid
            size="small"
            disabled={disabled || isLoading}
            loading={assign.isPending}
            icon="arrowForward"
            onClick={() => assign.mutate({ reportId })}
          >
            <Text color="white" variant="small" fontWeight="semiBold">
              {reportText.statusSelect.assignButton}
            </Text>
          </Button>
        )}

        <Box display="flex" columnGap={2}>
          <Box style={{ flex: 1 }}>
            <Button
              fluid
              size="small"
              colorScheme="destructive"
              disabled={disabled || isLoading || !canDeny}
              loading={deny.isPending}
              onClick={() => setIsModalOpen(true)}
            >
              <Text color="white" variant="small" fontWeight="semiBold">
                {reportText.statusSelect.denyButton}
              </Text>
            </Button>
          </Box>
          <Box style={{ flex: 1 }}>
            <Button
              fluid
              size="small"
              disabled={disabled || isLoading || !isInReview}
              loading={approve.isPending}
              onClick={() => approve.mutate({ reportId })}
            >
              <Text color="white" variant="small" fontWeight="semiBold">
                {reportText.statusSelect.approveButton}
              </Text>
            </Button>
          </Box>
        </Box>
      </Stack>

      <ReportDenialModal
        visible={isModalOpen}
        isLoading={deny.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(denialReason) => deny.mutate({ reportId, denialReason })}
      />
    </>
  )
}
