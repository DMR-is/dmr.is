'use client'

import { useRouter } from 'next/navigation'

import useSWRMutation from 'swr/mutation'

import { DropdownMenu, toast } from '@island.is/island-ui/core'

import {
  ApplicationTypeEnum,
  CreateRecallCaseAndApplicationRecallTypeEnum,
} from '../../../gen/fetch'
import { PageRoutes } from '../../../lib/constants'
import {
  createCommonCaseAndApplication,
  createRecallCaseAndApplication,
} from '../../../lib/fetchers'
export const CreateApplication = () => {
  const router = useRouter()

  const { trigger: createRecallApplication, isMutating: isRecallMutating } =
    useSWRMutation(
      'createRecallCaseAndApplication',
      (
        _key: string,
        {
          arg,
        }: {
          arg: { recallType: CreateRecallCaseAndApplicationRecallTypeEnum }
        },
      ) => createRecallCaseAndApplication({ recallType: arg.recallType }),
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

          const routeToTake =
            data.applicationType === ApplicationTypeEnum.BANKRUPTCY
              ? PageRoutes.APPLICATION_THROTABU
              : PageRoutes.APPLICATION_DANARBU

          router.push(`${routeToTake}/${data.id}`)
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

  const { trigger: createCommonApplication, isMutating: isCommonMutating } =
    useSWRMutation(
      'createCommonApplication',
      () => createCommonCaseAndApplication(),
      {
        onSuccess: (data) => {
          router.push(`${PageRoutes.APPLICATION_COMMON}/${data.id}`)
        },
        onError: (_error) => {
          toast.error(
            'Ekki tókst að stofna almennri umsókn. Vinsamlegast reyndu aftur síðar.',
            {
              toastId: 'createCommonApplicationError',
            },
          )
        },
      },
    )

  return (
    <DropdownMenu
      title="Stofna umsókn"
      icon="hammer"
      loading={isRecallMutating || isCommonMutating}
      items={[
        {
          title: 'Almenn umsókn',
          onClick: () => createCommonApplication(),
        },
        {
          title: 'Innköllun þrotabús',
          onClick: () =>
            createRecallApplication({
              recallType:
                CreateRecallCaseAndApplicationRecallTypeEnum.BANKRUPTCY,
            }),
        },
        {
          title: 'Innköllun dánarbús',
          onClick: () =>
            createRecallApplication({
              recallType: CreateRecallCaseAndApplicationRecallTypeEnum.DECEASED,
            }),
        },
      ]}
    />
  )
}
