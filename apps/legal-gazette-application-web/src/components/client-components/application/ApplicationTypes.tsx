'use client'

import { useRouter } from 'next/navigation'

import useSWRMutation from 'swr/mutation'

import { DropdownMenu, toast } from '@island.is/island-ui/core'

import { PageRoutes } from '../../../lib/constants'
import { createBankruptcyCaseAndApplication } from '../../../lib/fetchers'
export const ApplicationTypes = () => {
  const router = useRouter()

  const { trigger: createBankruptcyTrigger, isMutating } = useSWRMutation(
    'createBankruptcyCaseAndApplication',
    createBankruptcyCaseAndApplication,
    {
      onSuccess: ({ id }) => {
        router.push(`${PageRoutes.APPLICATION_THROTABU}/${id}`)
      },
      onError: (_error) => {
        toast.error(
          'Ekki tókst að stofna umsókn. Vinsamlegast reyndu aftur síðar.',
          {
            toastId: 'createBankruptcyCaseAndApplicationError',
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
          onClick: () => createBankruptcyTrigger(),
        },
        {
          title: 'Innköllun dánarbús',
          href: PageRoutes.APPLICATION_DANARBU,
        },
      ]}
    />
  )
}
