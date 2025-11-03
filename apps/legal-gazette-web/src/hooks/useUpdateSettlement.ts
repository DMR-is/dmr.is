import { useCallback } from 'react'

import { toast } from '@dmr.is/ui/components/island-is'

import { AdvertDetailedDto, SettlementDto } from '../gen/fetch'
import { useSuspenseQuery, useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const createOptimisticDataForSettlement = (
  prevData: AdvertDetailedDto,
  variables: SettlementDto,
): AdvertDetailedDto => {
  return {
    ...prevData,
    settlement: {
      ...prevData.settlement,
      ...variables,
    },
  }
}

export const useUpdateSettlement = (advertId: string, settlementId: string) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: advert } = useSuspenseQuery(
    trpc.getAdvert.queryOptions({ id: advertId }),
  )

  const { mutate: updateSettlementMutation, isPending: isUpdatingSettlement } =
    useMutation(
      trpc.updateSettlementSchema.mutationOptions({
        onMutate: async (variables) => {
          await queryClient.cancelQueries(
            trpc.getAdvert.queryFilter({ id: advertId }),
          )

          const prevData = queryClient.getQueryData(
            trpc.getAdvert.queryKey({ id: advertId }),
          ) as AdvertDetailedDto

          const filteredSettlementData = Object.fromEntries(
            Object.entries(variables).filter(([_, value]) => !!value),
          )

          const optimisticData = createOptimisticDataForSettlement(
            prevData,
            filteredSettlementData as unknown as SettlementDto,
          )

          queryClient.setQueryData(
            trpc.getAdvert.queryKey({ id: variables.id }),
            optimisticData,
          )

          return prevData
        },
        onSuccess: () => {
          queryClient.invalidateQueries(
            trpc.getAdvert.queryFilter({ id: advertId }),
          )
        },
        onError: (_error, _variables, mutateResults) => {
          if (mutateResults) {
            queryClient.setQueryData(
              trpc.getAdvert.queryKey({ id: advertId }),
              mutateResults as AdvertDetailedDto,
            )
          }
        },
      }),
    )

  const updateLiquidatorName = useCallback(
    (liquidatorName: string) => {
      if (advert?.settlement?.liquidatorName === liquidatorName) {
        return
      }
      updateSettlementMutation(
        {
          id: settlementId,
          liquidatorName,
        },
        {
          onSuccess: () => {
            toast.success('Nafn skiptastjóra vistað')
          },
          onError: () => {
            toast.error('Ekki tókst að vista nafn skiptastjóra')
          },
        },
      )
    },
    [advertId, settlementId, updateSettlementMutation],
  )

  const updateLiquidatorLocation = useCallback(
    (liquidatorLocation: string) => {
      if (advert?.settlement?.liquidatorLocation === liquidatorLocation) {
        return
      }
      updateSettlementMutation(
        {
          id: settlementId,
          liquidatorLocation,
        },
        {
          onSuccess: () => {
            toast.success('Staðsetning skiptastjóra vistuð')
          },
          onError: () => {
            toast.error('Ekki tókst að vista staðsetningu skiptastjóra')
          },
        },
      )
    },
    [advertId, settlementId, updateSettlementMutation],
  )

  const updateSettlementName = useCallback(
    (settlementName: string) => {
      if (advert?.settlement?.settlementName === settlementName) {
        return
      }
      updateSettlementMutation(
        {
          id: settlementId,
          settlementName,
        },
        {
          onSuccess: () => {
            toast.success('Heiti bús vistað')
          },
          onError: () => {
            toast.error('Ekki tókst að vista heiti bús')
          },
        },
      )
    },
    [advertId, settlementId, updateSettlementMutation],
  )

  const updateSettlementAddress = useCallback(
    (settlementAddress: string) => {
      if (advert?.settlement?.settlementAddress === settlementAddress) {
        return
      }
      updateSettlementMutation(
        {
          id: settlementId,
          settlementAddress,
        },
        {
          onSuccess: () => {
            toast.success('Heimilisfang bús vistað')
          },
          onError: () => {
            toast.error('Ekki tókst að vista heimilisfang bús')
          },
        },
      )
    },
    [advertId, settlementId, updateSettlementMutation],
  )

  const updateSettlementNationalId = useCallback(
    (settlementNationalId: string) => {
      if (advert?.settlement?.settlementNationalId === settlementNationalId) {
        return
      }

      updateSettlementMutation(
        {
          id: settlementId,
          settlementNationalId,
        },
        {
          onSuccess: () => {
            toast.success('Kennitala bús vistuð')
          },
          onError: () => {
            toast.error('Ekki tókst að vista kennitölu bús')
          },
        },
      )
    },
    [advertId, settlementId, updateSettlementMutation],
  )

  const updateSettlementDeadline = useCallback(
    (settlementDeadline: string) => {
      if (advert?.settlement?.settlementDeadline === settlementDeadline) {
        return
      }

      updateSettlementMutation(
        {
          id: settlementId,
          settlementDeadline,
        },
        {
          onSuccess: () => {
            toast.success('Frestur til að gera kröfu vistaður')
          },
          onError: () => {
            toast.error('Ekki tókst að vista frest til að gera kröfu')
          },
        },
      )
    },
    [advertId, settlementId, updateSettlementMutation],
  )

  const updateSettlementDateOfDeath = useCallback(
    (settlementDateOfDeath: string) => {
      if (advert?.settlement?.settlementDateOfDeath === settlementDateOfDeath) {
        return
      }

      updateSettlementMutation(
        {
          id: settlementId,
          settlementDateOfDeath,
        },
        {
          onSuccess: () => {
            toast.success('Dánardagur vistaður')
          },
          onError: () => {
            toast.error('Ekki tókst að vista dánardag')
          },
        },
      )
    },
    [advertId, settlementId, updateSettlementMutation],
  )

  const updateDeclaredClaims = useCallback(
    (declaredClaims: number) => {
      if (advert?.settlement?.declaredClaims === declaredClaims) {
        return
      }

      updateSettlementMutation(
        {
          id: settlementId,
          declaredClaims,
        },
        {
          onSuccess: () => {
            toast.success('Skráð kröfur vistaðar')
          },
          onError: () => {
            toast.error('Ekki tókst að vista skráðar kröfur')
          },
        },
      )
    },
    [advertId, settlementId, updateSettlementMutation],
  )

  return {
    updateLiquidatorName,
    updateLiquidatorLocation,
    updateSettlementName,
    updateSettlementAddress,
    updateSettlementNationalId,
    updateSettlementDeadline,
    updateSettlementDateOfDeath,
    updateDeclaredClaims,
    isUpdatingSettlement,
  }
}
