'use client'

import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Tooltip } from '@dmr.is/ui/components/island-is/Tooltip'
import { DMRTag } from '@dmr.is/ui/components/Tag/Tag'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  settingId: string
  settingNationalId: string
  isActive: boolean
}

export const ToggleTBRSettingsStatus = ({
  settingId,
  settingNationalId,
  isActive,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: toggleSettingStatus, isPending } = useMutation(
    trpc.toggleSettingStatus.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(trpc.getTbrSettings.queryFilter())

        const prevData = queryClient.getQueryData(
          trpc.getTbrSettings.queryKey(),
        )

        if (!prevData) return

        const optimisticData = {
          ...prevData,
          items: prevData.items.map((setting) =>
            setting.nationalId === settingNationalId
              ? { ...setting, active: variables.isActive }
              : setting,
          ),
        }

        queryClient.setQueryData(trpc.getTbrSettings.queryKey(), optimisticData)

        return prevData
      },
      onSuccess: (_data, variables) => {
        toast.success(
          `Stilling ${variables.isActive ? 'virkjuð' : 'óvirkjuð'}`,
          { toastId: 'activate-tbr-setting' },
        )

        queryClient.invalidateQueries(trpc.getTbrSettings.queryFilter())
      },
      onError: (_err, variables, onMutateResults) => {
        toast.error(
          `Ekki tókst að ${variables.isActive ? 'virkja' : 'óvirkja'} stillingu`,
          {
            toastId: 'activate-tbr-setting-error',
          },
        )

        if (onMutateResults) {
          queryClient.setQueryData(
            trpc.getTbrSettings.queryKey(),
            onMutateResults,
          )
        }
      },
    }),
  )

  return (
    <Tooltip
      iconSize="medium"
      text={`Smelltu hér til gera stillingu ${isActive ? 'óvirka' : 'virka'}`}
    >
      <DMRTag
        variant={isActive ? 'mint' : 'rose'}
        disabled={isPending}
        onClick={(e) => {
          toggleSettingStatus({ id: settingId, isActive: !isActive })
          e?.stopPropagation()
        }}
      >
        {isActive ? 'Virkur' : 'Óvirkur'}
      </DMRTag>
    </Tooltip>
  )
}
