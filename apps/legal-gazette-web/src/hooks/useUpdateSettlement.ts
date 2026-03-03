import { useCallback } from 'react'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { ApplicationRequirementStatementEnum } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'
import { AdvertDetails } from '../lib/trpc/types'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const createOptimisticDataForSettlement = (
  prevData: AdvertDetails,
  variables: Record<string, unknown>,
): AdvertDetails => {
  if (!prevData.settlement) {
    return prevData
  }

  const toIsoStringOrNull = (
    value: unknown,
  ): string | null | undefined => {
    if (value === undefined) return undefined
    if (value === null) return null
    return value instanceof Date ? value.toISOString() : String(value)
  }

  const settlement = {
    ...prevData.settlement,
  }

  if (variables.liquidatorName !== undefined) {
    settlement.liquidatorName = variables.liquidatorName as string
  }
  if (variables.liquidatorLocation !== undefined) {
    settlement.liquidatorLocation = variables.liquidatorLocation as string
  }
  if (variables.settlementName !== undefined) {
    settlement.name = variables.settlementName as string
  }
  if (variables.settlementNationalId !== undefined) {
    settlement.nationalId = variables.settlementNationalId as string
  }
  if (variables.settlementAddress !== undefined) {
    settlement.address = variables.settlementAddress as string
  }
  if (variables.declaredClaims !== undefined) {
    settlement.declaredClaims = variables.declaredClaims as number
  }
  if (variables.liquidatorRecallStatementLocation !== undefined) {
    settlement.liquidatorRecallStatementLocation =
      variables.liquidatorRecallStatementLocation as string
  }
  if (variables.liquidatorRecallStatementType !== undefined) {
    settlement.liquidatorRecallStatementType =
      variables.liquidatorRecallStatementType as ApplicationRequirementStatementEnum
  }
  if (variables.type !== undefined) {
    settlement.type = variables.type as typeof settlement.type
  }
  if (variables.settlementDeadline !== undefined) {
    settlement.deadline = toIsoStringOrNull(variables.settlementDeadline)
  }
  if (variables.settlementDateOfDeath !== undefined) {
    settlement.dateOfDeath = toIsoStringOrNull(variables.settlementDateOfDeath)
  }

  return {
    ...prevData,
    settlement,
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

          const prevData = queryClient.getQueryData<AdvertDetails>(
            trpc.getAdvert.queryKey({ id: advertId }),
          )

          if (!prevData) {
            return
          }

          const filteredSettlementData = Object.fromEntries(
            Object.entries(variables).filter(([_, value]) => value !== undefined),
          )

          const optimisticData = createOptimisticDataForSettlement(
            prevData,
            filteredSettlementData,
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
              mutateResults,
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
          settlementDeadline: new Date(settlementDeadline),
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
          settlementDateOfDeath: new Date(settlementDateOfDeath),
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
