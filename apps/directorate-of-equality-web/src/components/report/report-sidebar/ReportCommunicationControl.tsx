'use client'

import React from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CommunicationStatusEnum } from '../../../gen/fetch'
import { CommunicationStatusTranslatedEnum } from '../../../lib/constants'
import { reportText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { ReportSendToEditModal } from './ReportSendToEditModal'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = reportText.communicationControl

type Props = {
  reportId: string
  communicationStatus: CommunicationStatusEnum
  // Communication is only mutable while the report is IN_REVIEW.
  disabled?: boolean
}

export const ReportCommunicationControl = ({
  reportId,
  communicationStatus,
  disabled,
}: Props) => {
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

  const onSuccess = () => toast.success(t.successToast)
  const onError = () => toast.error(t.errorToast)

  const openCommunication = useMutation({
    ...trpc.reportWorkflow.openCommunication.mutationOptions(),
    onSuccess: () => {
      invalidate()
      onSuccess()
    },
    onError,
  })

  const closeCommunication = useMutation({
    ...trpc.reportWorkflow.closeCommunication.mutationOptions(),
    onSuccess: () => {
      invalidate()
      onSuccess()
    },
    onError,
  })

  const sendToEdit = useMutation({
    ...trpc.reportWorkflow.sendToEdit.mutationOptions(),
    onSuccess: () => {
      invalidate()
      onSuccess()
      setIsModalOpen(false)
    },
    onError,
  })

  const isLoading =
    openCommunication.isPending ||
    closeCommunication.isPending ||
    sendToEdit.isPending

  const isOpen =
    communicationStatus === CommunicationStatusEnum.OPEN ||
    communicationStatus === CommunicationStatusEnum.AWAITING_RESPONSE ||
    communicationStatus === CommunicationStatusEnum.RESPONSE_RECEIVED

  return (
    <>
      <Stack space={2}>
        <Box background="white" borderRadius="large">
          <Input
            name="report-communication-status"
            readOnly
            value={CommunicationStatusTranslatedEnum[communicationStatus]}
            size="sm"
            label={t.label}
          />
        </Box>

        <Box display="flex" columnGap={2}>
          <Box style={{ flex: 1 }}>
            <Button
              fluid
              size="small"
              variant="ghost"
              disabled={disabled || isLoading}
              loading={
                openCommunication.isPending || closeCommunication.isPending
              }
              onClick={() =>
                isOpen
                  ? closeCommunication.mutate({ reportId })
                  : openCommunication.mutate({ reportId })
              }
            >
              <Text variant="small" fontWeight="semiBold">
                {isOpen ? t.closeButton : t.openButton}
              </Text>
            </Button>
          </Box>
          <Box style={{ flex: 1 }}>
            <Button
              fluid
              size="small"
              disabled={disabled || isLoading}
              loading={sendToEdit.isPending}
              onClick={() => setIsModalOpen(true)}
            >
              <Text color="white" variant="small" fontWeight="semiBold">
                {t.sendToEditButton}
              </Text>
            </Button>
          </Box>
        </Box>
      </Stack>

      <ReportSendToEditModal
        visible={isModalOpen}
        isLoading={sendToEdit.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(reason) => sendToEdit.mutate({ reportId, reason })}
      />
    </>
  )
}
