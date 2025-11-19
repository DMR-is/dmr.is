'use client'

import { useRouter } from 'next/navigation'

import { DropdownMenu, toast } from '@dmr.is/ui/components/island-is'

import {
  ApplicationTypeEnum,
  CreateApplicationApplicationTypeEnum,
} from '../../gen/fetch'
import { PageRoutes } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'
export const CreateApplication = () => {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: createApplication, isPending } = useMutation(
    trpc.createApplication.mutationOptions({
      onMutate: () => {
        queryClient.invalidateQueries(
          trpc.getApplications.queryFilter(),
        )
      },
      onSuccess: (data) => {
        if (data.applicationType === ApplicationTypeEnum.RECALLBANKRUPTCY) {
          router.push(`${PageRoutes.APPLICATION_THROTABU}/${data.id}`)
        }

        if (data.applicationType === ApplicationTypeEnum.RECALLDECEASED) {
          router.push(`${PageRoutes.APPLICATION_DANARBU}/${data.id}`)
        }

        if (data.applicationType === ApplicationTypeEnum.COMMON) {
          router.push(`${PageRoutes.APPLICATION_COMMON}/${data.id}`)
        }

        router.refresh()
      },
      onError: (error) => {
        toast.error(
          error?.message ||
            'Ekki tókst að stofna umsókn. Vinsamlegast reyndu aftur síðar.',
          {
            toastId: 'createApplicationError',
          },
        )
      },
    }),
  )

  return (
    <DropdownMenu
      title="Stofna umsókn"
      icon="hammer"
      loading={isPending}
      items={[
        {
          title: 'Almenn umsókn',
          onClick: () =>
            createApplication(CreateApplicationApplicationTypeEnum.COMMON),
        },
        {
          title: 'Innköllun þrotabús',
          onClick: () =>
            createApplication(
              CreateApplicationApplicationTypeEnum.RECALLBANKRUPTCY,
            ),
        },
        {
          title: 'Innköllun dánarbús',
          onClick: () =>
            createApplication(
              CreateApplicationApplicationTypeEnum.RECALLDECEASED,
            ),
        },
      ]}
    />
  )
}
