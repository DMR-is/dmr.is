'use client'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useTRPC } from '../../lib/trpc/client/trpc'
import { TbrSettingsResult } from '../../lib/trpc/types'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  settingName: string
  settingId: string
}

export const DeleteTBRSetting = ({ settingName, settingId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation(
    trpc.deleteTbrSetting.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(trpc.getTbrSettings.queryFilter())

        const prevData = queryClient.getQueryData<TbrSettingsResult>(
          trpc.getTbrSettings.queryKey(),
        )

        if (!prevData) return

        const optimisticData: TbrSettingsResult = {
          ...prevData,
          items:
            prevData?.items.filter((setting) => setting.id !== variables.id) ||
            [],
        }

        queryClient.setQueryData(trpc.getTbrSettings.queryKey(), optimisticData)

        return prevData
      },
      onSuccess: () => {
        toast.success(`${settingName} eytt`, {
          toastId: 'delete-tbr-setting',
        })
        queryClient.invalidateQueries(trpc.getTbrSettings.queryFilter())
      },
      onError: (_err, _variables, onMutateResults) => {
        toast.error(`Ekki tókst að eyða ${settingName}`, {
          toastId: 'delete-tbr-setting-error',
        })

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
    <Button
      circle
      icon="trash"
      colorScheme="destructive"
      size="small"
      loading={isPending}
      onClick={(e) => {
        mutate({ id: settingId })

        // Prevent row expansion
        e.stopPropagation()
      }}
    />
  )
}
