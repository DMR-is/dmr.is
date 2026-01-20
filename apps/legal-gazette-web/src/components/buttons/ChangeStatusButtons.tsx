'use client'

import { useRouter } from 'next/navigation'

import { useMemo } from 'react'

import {
  Box,
  Button,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { Route } from '@dmr.is/ui/hooks/constants'

import { Inline } from '@island.is/island-ui/core'

import { StatusDto } from '../../gen/fetch'
import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'
import { StatusIdEnum } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  advertId: string
  canEdit?: boolean
  currentStatus: StatusDto
  setModalVisible: (visible: boolean) => void
}

export const ChangeStatusButtons = ({
  advertId,
  currentStatus,
  canEdit = false,
  setModalVisible,
}: Props) => {
  const {
    moveToNextStatus,
    moveToPreviousStatus,
    reactivateAdvert,
    isMovingToNextStatus,
    isMovingToPreviousStatus,
    isReactivating,
  } = useUpdateAdvert(advertId)
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutate: rejectAdvert, isPending: isRejecting } = useMutation(
    trpc.rejectAdvert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )
      },
    }),
  )

  const isLoading =
    isMovingToNextStatus || isMovingToPreviousStatus || isRejecting || isReactivating

  const prevMovableStatuses: string[] = [
    StatusIdEnum.READY_FOR_PUBLICATION,
    StatusIdEnum.IN_PROGRESS,
  ]

  const nextMovableStatuses: string[] = [
    StatusIdEnum.SUBMITTED,
    StatusIdEnum.IN_PROGRESS,
  ]

  const canMoveToPreviousStatus = useMemo(() => {
    return prevMovableStatuses.includes(currentStatus.id)
  }, [currentStatus.id, prevMovableStatuses])

  const canMoveToNextStatus = useMemo(() => {
    return nextMovableStatuses.includes(currentStatus.id)
  }, [currentStatus.id, nextMovableStatuses])

  const prevText = useMemo(() => {
    switch (currentStatus.id) {
      case StatusIdEnum.READY_FOR_PUBLICATION:
        return 'Færa í vinnslu'
      case StatusIdEnum.IN_PROGRESS:
        return 'Færa í innsent'
      default:
        return 'Færa í fyrri stöðu'
    }
  }, [currentStatus.id])

  const nextText = useMemo(() => {
    switch (currentStatus.id) {
      case StatusIdEnum.SUBMITTED:
        return 'Færa í vinnslu'
      case StatusIdEnum.IN_PROGRESS:
        return 'Færa í tilbúið til útgáfu'
      default:
        return 'Færa í næstu stöðu'
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
      {currentStatus.id === StatusIdEnum.REJECTED && (
        <Button
          fluid
          size="small"
          disabled={isLoading || !canEdit}
          loading={isReactivating}
          icon="reload"
          onClick={reactivateAdvert}
        >
          <Text color="white" variant="small" fontWeight="semiBold">
            Endurvirkja auglýsingu
          </Text>
        </Button>
      )}
      {canMoveToPreviousStatus && (
        <Button
          fluid
          size="small"
          disabled={isLoading || !canEdit}
          loading={isLoading}
          preTextIcon="arrowBack"
          onClick={moveToPreviousStatus}
        >
          <Text color="white" variant="small" fontWeight="semiBold">
            {prevText}
          </Text>
        </Button>
      )}
      {canMoveToNextStatus ? (
        <Button
          fluid
          size="small"
          disabled={isLoading || !canEdit}
          loading={isLoading}
          icon="arrowForward"
          onClick={moveToNextStatus}
        >
          <Text color="white" variant="small" fontWeight="semiBold">
            {nextText}
          </Text>
        </Button>
      ) : (
        <Box borderRadius="large" background="white">
          <Button
            onClick={() =>
              currentStatus.id == StatusIdEnum.READY_FOR_PUBLICATION
                ? router.push(Route.UTGAFA)
                : router.push(Route.HEILDARYFIRLIT)
            }
            variant="ghost"
            size="small"
            icon="open"
            iconType="outline"
            fluid
          >
            <Text color="blue400" fontWeight="semiBold" variant="small">
              {currentStatus.id == StatusIdEnum.READY_FOR_PUBLICATION
                ? 'Sjá útgáfur í bið'
                : 'Sjá öll mál'}
            </Text>
          </Button>
        </Box>
      )}
      <Inline space={0} flexWrap="wrap" justifyContent={'spaceBetween'}>
        <Button
          variant="ghost"
          size="small"
          onClick={() => {
            setModalVisible(true)
          }}
        >
          <Text color="blue400" fontWeight="semiBold" variant="small">
            &nbsp;Skoða auglýsingu&nbsp;
          </Text>
        </Button>
        {currentStatus.id !== StatusIdEnum.REJECTED && (
          <Button
            disabled={!canEdit}
            colorScheme="destructive"
            size="small"
            onClick={() => rejectAdvert({ id: advertId })}
          >
            <Text color="white" fontWeight="semiBold" variant="small">
              &nbsp;Hafna auglýsingu&nbsp;
            </Text>
          </Button>
        )}
      </Inline>
    </Stack>
  )
}
