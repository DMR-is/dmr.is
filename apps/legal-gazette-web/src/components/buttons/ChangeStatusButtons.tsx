'use client'

import { useMemo } from 'react'

import {
  Box,
  Button,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { StatusDto, StatusIdEnum } from '../../gen/fetch'
import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'

type Props = {
  advertId: string
  canEdit?: boolean
  currentStatus: StatusDto
}

export const ChangeStatusButtons = ({
  advertId,
  currentStatus,
  canEdit = false,
}: Props) => {
  const {
    moveToNextStatus,
    moveToPreviousStatus,
    isMovingToNextStatus,
    isMovingToPreviousStatus,
  } = useUpdateAdvert(advertId)

  const isLoading = isMovingToNextStatus || isMovingToPreviousStatus

  const prevMovableStatuses = [
    StatusIdEnum.READY_FOR_PUBLICATION,
    StatusIdEnum.IN_PROGRESS,
  ]

  const nextMovableStatuses = [StatusIdEnum.SUBMITTED, StatusIdEnum.IN_PROGRESS]

  const canMoveToPreviousStatus = useMemo(() => {
    return prevMovableStatuses.includes(currentStatus.id)
  }, [currentStatus.id, prevMovableStatuses])

  const canMoveToNextStatus = useMemo(() => {
    return nextMovableStatuses.includes(currentStatus.id)
  }, [currentStatus.id, nextMovableStatuses])

  const prevText = useMemo(() => {
    switch (currentStatus.id) {
      case StatusIdEnum.READY_FOR_PUBLICATION:
        return 'Fara í vinnslu'
      case StatusIdEnum.IN_PROGRESS:
        return 'Fara í innsent'
      default:
        return 'Fara í fyrri stöðu'
    }
  }, [currentStatus.id])

  const nextText = useMemo(() => {
    switch (currentStatus.id) {
      case StatusIdEnum.SUBMITTED:
        return 'Færa í vinnslu'
      case StatusIdEnum.IN_PROGRESS:
        return 'Fara í tilbúið til útgáfu'
      default:
        return 'Fara í næstu stöðu'
    }
  }, [currentStatus.id])

  return (
    <Stack space={2}>
      <Box background="white" borderRadius="large">
        <Input
          name="advert-status"
          readOnly
          value={currentStatus.title}
          size="sm"
          label="Staða auglýsingar"
        />
      </Box>
      <Button
        fluid
        size="small"
        disabled={!canMoveToPreviousStatus || isLoading || !canEdit}
        loading={isLoading}
        preTextIcon="arrowBack"
        onClick={moveToPreviousStatus}
      >
        <Text color="white" variant="small" fontWeight="semiBold">
          {prevText}
        </Text>
      </Button>
      <Button
        fluid
        size="small"
        disabled={!canMoveToNextStatus || isLoading || !canEdit}
        loading={isLoading}
        icon="arrowForward"
        onClick={moveToNextStatus}
      >
        <Text color="white" variant="small" fontWeight="semiBold">
          {nextText}
        </Text>
      </Button>
    </Stack>
  )
}
