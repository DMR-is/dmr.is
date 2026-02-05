import { useCallback } from 'react'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { toast } from '@dmr.is/ui/components/island-is'

import {
  AdvertDetailedDto,
  ApplicationRequirementStatementEnum,
  SettlementDto,
} from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

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
            trpc.getAdvert.queryKey({ id: advertId }),
            optimisticData,
          )

          return prevData
        },
        onSettled: () => {
          queryClient.invalidateQueries(
            trpc.getAdvert.queryFilter({ id: advertId }),
          )
          queryClient.invalidateQueries(trpc.getPublication.queryFilter())
        },
        onError: (_err, _variables, mutateResults) => {
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
    [
      advertId,
      settlementId,
      updateSettlementMutation,
      advert?.settlement?.liquidatorName,
    ],
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
    [
      advertId,
      settlementId,
      updateSettlementMutation,
      advert?.settlement?.liquidatorLocation,
    ],
  )

  const updateRecallStatementType = useCallback(
    (liquidatorRecallStatementType: ApplicationRequirementStatementEnum) => {
      if (
        advert?.settlement?.liquidatorRecallStatementType ===
        liquidatorRecallStatementType
      ) {
        return
      }
      updateSettlementMutation(
        {
          id: settlementId,
          liquidatorRecallStatementType,
        },
        {
          onSuccess: () => {
            toast.success('Kröfulýsing vistuð')
          },
          onError: () => {
            toast.error('Ekki tókst að vista kröfulýsingu')
          },
        },
      )
    },
    [
      advertId,
      settlementId,
      updateSettlementMutation,
      advert?.settlement?.liquidatorRecallStatementType,
    ],
  )

  const updateRecallStatementLocation = useCallback(
    (liquidatorRecallStatementLocation: string) => {
      if (
        advert?.settlement?.liquidatorRecallStatementLocation ===
        liquidatorRecallStatementLocation
      ) {
        return
      }
      updateSettlementMutation(
        {
          id: settlementId,
          liquidatorRecallStatementLocation,
        },
        {
          onSuccess: () => {
            toast.success('Staðsetning/tölvupóstur kröfulýsingar vistuð')
          },
          onError: () => {
            toast.error(
              'Ekki tókst að vista staðsetningu/tölvupóst kröfulýsingar',
            )
          },
        },
      )
    },
    [
      advertId,
      settlementId,
      updateSettlementMutation,
      advert?.settlement?.liquidatorRecallStatementLocation,
    ],
  )

  const updateSettlementName = useCallback(
    (settlementName: string) => {
      if (advert?.settlement?.name === settlementName) {
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
      if (advert?.settlement?.address === settlementAddress) {
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
    [
      advertId,
      settlementId,
      updateSettlementMutation,
      advert?.settlement?.address,
    ],
  )

  const updateSettlementNationalId = useCallback(
    (settlementNationalId: string) => {
      if (advert?.settlement?.nationalId === settlementNationalId) {
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
      if (advert?.settlement?.deadline === settlementDeadline) {
        return
      }

      updateSettlementMutation(
        {
          id: settlementId,
          settlementDeadline,
        },
        {
          onSuccess: () => {
            toast.success('Frestdagur vistaður')
          },
          onError: () => {
            toast.error('Ekki tókst að vista frestdag')
          },
        },
      )
    },
    [
      advertId,
      settlementId,
      updateSettlementMutation,
      advert?.settlement?.nationalId,
    ],
  )

  const updateSettlementDateOfDeath = useCallback(
    (settlementDateOfDeath: string) => {
      if (advert?.settlement?.dateOfDeath === settlementDateOfDeath) {
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
    [
      advertId,
      settlementId,
      updateSettlementMutation,
      advert?.settlement?.dateOfDeath,
    ],
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
    [
      advertId,
      settlementId,
      updateSettlementMutation,
      advert?.settlement?.declaredClaims,
    ],
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
    updateRecallStatementType,
    updateRecallStatementLocation,
    isUpdatingSettlement,
  }
}
