'use client'

import { useRouter } from 'next/navigation'

import useSWRMutation from 'swr/mutation'

import { DropdownMenu, toast } from '@island.is/island-ui/core'

import {
  ApplicationTypeEnum,
  CreateApplicationApplicationTypeEnum,
} from '../../../gen/fetch'
import { PageRoutes } from '../../../lib/constants'
import { createApplication } from '../../../lib/fetchers'
export const CreateApplication = () => {
  const router = useRouter()

  const { trigger: createApplicationTrigger, isMutating } = useSWRMutation(
    'createRecallCaseAndApplication',
    (
      _key: string,
      {
        arg,
      }: {
        arg: { type: CreateApplicationApplicationTypeEnum }
      },
    ) => createApplication({ applicationType: arg.type }),
    {
      onSuccess: (data) => {
        if (!data.applicationType) {
          toast.error(
            'Umsóknartegund vantar. Vinsamlegast reyndu aftur síðar.',
            {
              toastId: 'createRecallCaseAndApplicationError',
            },
          )

          return
        }

        let routeToTake
        if (data.applicationType === ApplicationTypeEnum.RECALLBANKRUPTCY) {
          routeToTake = PageRoutes.APPLICATION_THROTABU
        } else if (
          data.applicationType === ApplicationTypeEnum.RECALLDECEASED
        ) {
          routeToTake = PageRoutes.APPLICATION_DANARBU
        } else if (data.applicationType === ApplicationTypeEnum.COMMON) {
          routeToTake = PageRoutes.APPLICATION_COMMON
        } else {
          throw new Error('Unsupported application type')
        }

        router.refresh()

        setTimeout(() => {
          router.push(`${routeToTake}/${data.id}`)
        }, 100)
      },
      onError: (_error) => {
        toast.error(
          'Ekki tókst að stofna umsókn. Vinsamlegast reyndu aftur síðar.',
          {
            toastId: 'createRecallCaseAndApplicationError',
          },
        )
      },
    },
  )

  return (
    <DropdownMenu
      title="Stofna umsókn"
      icon="hammer"
      loading={isMutating}
      items={[
        {
          title: 'Almenn umsókn',
          onClick: () =>
            createApplicationTrigger({
              type: CreateApplicationApplicationTypeEnum.COMMON,
            }),
        },
        {
          title: 'Innköllun þrotabús',
          onClick: () =>
            createApplicationTrigger({
              type: CreateApplicationApplicationTypeEnum.RECALLBANKRUPTCY,
            }),
        },
        {
          title: 'Innköllun dánarbús',
          onClick: () =>
            createApplicationTrigger({
              type: CreateApplicationApplicationTypeEnum.RECALLDECEASED,
            }),
        },
      ]}
    />
  )
}
