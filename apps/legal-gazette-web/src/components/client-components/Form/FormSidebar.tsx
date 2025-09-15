'use client'
import { useRouter } from 'next/navigation'

import useSWRMutation from 'swr/mutation'

import {
  Box,
  Button,
  Input,
  Select,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { LinkV2, toast } from '@island.is/island-ui/core'

import { StatusEnum } from '../../../gen/fetch'
import { useAdvertContext } from '../../../hooks/useAdvertContext'
import { useClient } from '../../../hooks/useClient'
import { Route } from '../../../lib/constants'
import * as styles from './Form.css'
export const AdvertSidebar = () => {
  const { advert } = useAdvertContext()
  const router = useRouter() // TODO: maybe update the context instead of refreshing the whole page

  const userClient = useClient('UsersApi')
  const updateClient = useClient('AdvertUpdateApi')

  const isSubmitted = advert.status.title === StatusEnum.Innsent
  const isReadyForPublication =
    advert.status.title === StatusEnum.TilbúiðTilÚtgáfu

  const { trigger: markAdvertAsReadyTrigger } = useSWRMutation(
    'markAdvertAsReadyForPublication',
    (_key, { arg }: { arg: { id: string } }) =>
      updateClient.markAdvertAsReady({ id: arg.id }),
    {
      onSuccess: () => {
        toast.success('Auglýsing færð í stöðuna tilbúið til útgáfu', {
          toastId: 'markAdvertAsReady',
        })

        router.refresh()
      },
      onError: () => {
        toast.error(
          'Ekki tókst að færa auglýsingu í stöðuna tilbúið til útgáfu',
          {
            toastId: 'markAdvertAsReadyError',
          },
        )
      },
    },
  )

  const { trigger: markAdvertAsSubmittedTrigger } = useSWRMutation(
    'markAdvertAsSubmitted',
    (_key, { arg }: { arg: { id: string } }) =>
      updateClient.markAdvertAsSubmitted({ id: arg.id }),
    {
      onSuccess: () => {
        toast.success('Auglýsing færð í stöðuna innsent', {
          toastId: 'markAdvertAsSubmitted',
        })

        router.refresh()
      },
      onError: () => {
        toast.error('Ekki tókst að færa auglýsingu í stöðuna innsent', {
          toastId: 'markAdvertAsSubmittedError',
        })
      },
    },
  )

  return (
    <Box className={styles.advertSideBarStyle}>
      <Stack space={2}>
        <LinkV2 href={Route.RITSTJORN}>
          <Button
            variant="text"
            size="small"
            preTextIcon="arrowBack"
            preTextIconType="outline"
            fluid
          >
            Til baka í auglýsingar
          </Button>
        </LinkV2>
        <Select label="Starfsmaður" options={[]} size="sm" />
        <Box background="white">
          <Input
            name="advert-status"
            readOnly
            value={advert.status.title}
            size="sm"
            label="Staða auglýsingar"
          />
        </Box>
        {isSubmitted && (
          <Button
            size="small"
            fluid
            icon="arrowForward"
            iconType="outline"
            onClick={() => markAdvertAsReadyTrigger({ id: advert.id })}
          >
            <Text color="white" variant="small" fontWeight="semiBold">
              Færa í tilbúið til útgáfu
            </Text>
          </Button>
        )}
        {isReadyForPublication && (
          <Button
            size="small"
            fluid
            preTextIcon="arrowBack"
            preTextIconType="outline"
            onClick={() => markAdvertAsSubmittedTrigger({ id: advert.id })}
          >
            <Text color="white" variant="small" fontWeight="semiBold">
              Færa í innsent
            </Text>
          </Button>
        )}
      </Stack>
    </Box>
  )
}
