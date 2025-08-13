'use client'

import { useRouter } from 'next/navigation'

import useSWRMutation from 'swr/mutation'

import { DropdownMenu, toast } from '@island.is/island-ui/core'

import { ApplicationTypeEnum } from '../../../gen/fetch'
import { PageRoutes } from '../../../lib/constants'
import { createRecallCaseAndApplication } from '../../../lib/fetchers'
export const CreateApplication = () => {
  const router = useRouter()

  const { trigger, isMutating } = useSWRMutation(
    'createRecallCaseAndApplication',
    (_key: string, { arg }: { arg: { type: ApplicationTypeEnum } }) =>
      createRecallCaseAndApplication({ type: arg.type }),
    {
      onSuccess: (data) => {
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

  return (
    <DropdownMenu
      title="Stofna umsókn"
      icon="hammer"
      loading={isMutating}
      items={[
        {
          title: 'Innköllun þrotabús',
          onClick: () => trigger({ type: ApplicationTypeEnum.BANKRUPTCY }),
        },
        {
          title: 'Innköllun dánarbús',
          onClick: () => trigger({ type: ApplicationTypeEnum.DECEASED }),
        },
      ]}
    />
  )
}
