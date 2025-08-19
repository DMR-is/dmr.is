'use client'

import useSWRMutation from 'swr/mutation'

import { DropdownMenu, toast } from '@island.is/island-ui/core'

import { CreateDivisionMeetingForApplicationDto } from '../../../gen/fetch'
import { createDivisionMeetingForApplication } from '../../../lib/fetchers'

type Props = {
  caseId: string
}

export const AddAdvertsToApplicationMenu = ({ caseId }: Props) => {
  const { trigger: createDivisionMeetingAdvertTrigger } = useSWRMutation(
    'createDivisionMeetingAdvertForApplication',
    (_key, { arg }: { arg: CreateDivisionMeetingForApplicationDto }) =>
      createDivisionMeetingForApplication({
        caseId,
        createDivisionMeetingForApplicationDto: arg,
      }),
  )

  return (
    <DropdownMenu
      title="Bæta við"
      icon="hammer"
      iconType="outline"
      items={[
        {
          title: 'Innköllun',
          onClick: () => console.log('Creating recall advert'),
        },
        {
          title: 'Skiptafundi',
          onClick: () => {
            return createDivisionMeetingAdvertTrigger(
              {
                meetingDate: new Date().toISOString(),
                meetingLocation: 'Reykjavík',
              },
              {
                onSuccess: () => {
                  toast.success('Skiptafundi auglýsingu bætt við umsókn')
                },
                onError: () => {
                  toast.error(
                    'Villa kom upp við að bæta við skiptafundi auglýsingu',
                  )
                },
              },
            )
          },
        },
        {
          title: 'Skiptalokum',
        },
      ]}
    />
  )
}
