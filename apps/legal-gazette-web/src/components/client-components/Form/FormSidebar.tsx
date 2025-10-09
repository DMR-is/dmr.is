'use client'

import { useParams } from 'next/navigation'

import useSWR from 'swr'

import {
  Box,
  Button,
  Input,
  Select,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { LinkV2, toast } from '@island.is/island-ui/core'

import { AdvertDetailedDto, StatusEnum, StatusIdEnum } from '../../../gen/fetch'
import { useClient } from '../../../hooks/useClient'
import { Route } from '../../../lib/constants'
import { trpc } from '../../../lib/trpc/client'
import { AdvertFormStepper } from './AdvertFormStepper'
import * as styles from './Form.css'

export const AdvertSidebar = () => {
  const userClient = useClient('UsersApi')
  const utils = trpc.useUtils()
  const { id } = useParams()
  const [advert] = trpc.adverts.getAdvert.useSuspenseQuery({ id: id as string })

  const assignUserMutation = trpc.adverts.assignUser.useMutation({
    onSuccess: (_, variables) => {
      toast.success('Starfsmaður úthlutaður', {
        toastId: 'assignUserToAdvert',
      })
      utils.adverts.getAdvert.invalidate({ id: variables.id })
    },
    onError: (_, variables) => {
      toast.error('Ekki tókst að úthluta starfsmanni', {
        toastId: 'assignUserToAdvertError',
      })
      utils.adverts.getAdvert.invalidate({ id: variables.id })
    },
  })

  const changeAdvertStatusMutation =
    trpc.adverts.changeAdvertStatus.useMutation({
      onMutate: async (variables) => {
        await utils.adverts.getAdvert.cancel({ id: variables.id })
        const prevData = utils.adverts.getAdvert.getData({
          id: variables.id,
        }) as AdvertDetailedDto
        const optimisticData = {
          ...prevData,
          status: {
            id: variables.statusId,
            title:
              variables.statusId === StatusIdEnum.READY_FOR_PUBLICATION
                ? StatusEnum.TilbúiðTilÚtgáfu
                : StatusEnum.Innsent,
            slug: 'ready-for-publication',
          },
        }
        utils.adverts.getAdvert.setData({ id: variables.id }, optimisticData)
        return prevData
      },
      onSuccess: (_, variables) => {
        toast.success('Auglýsing fær stöðu tilbúin til útgáfu', {
          toastId: 'markAdvertAsReady',
        })
        utils.adverts.getAdvert.invalidate({ id: variables.id })
      },
      onError: (_, variables, mutateResults) => {
        toast.error(
          'Ekki tókst að færa auglýsingu í stöðu tilbúin til útgáfu',
          {
            toastId: 'markAdvertAsReadyError',
          },
        )
        utils.adverts.getAdvert.setData({ id: variables.id }, mutateResults)
      },
    })

  const { data: usersData, isLoading: isLoadingEmployees } = useSWR(
    'getEmployees',
    () => userClient.getEmployees(),
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
    },
  )

  if (!advert) return null

  const employeeOptions = usersData
    ? usersData.users?.map((user) => ({
        label: user.name,
        value: user.id,
      }))
    : []

  const defaultEmployee = usersData?.users?.find(
    (user) => user.id === advert.assignedUser,
  )

  const isSubmitted = advert?.status.title === StatusEnum.Innsent
  const shouldShowButton =
    advert?.status.title === StatusEnum.TilbúiðTilÚtgáfu ||
    advert?.status.title === StatusEnum.Innsent

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
        <Select
          isLoading={isLoadingEmployees}
          key={`select-employee-${defaultEmployee?.id}`}
          label="Starfsmaður"
          options={employeeOptions}
          value={
            defaultEmployee
              ? { label: defaultEmployee.name, value: defaultEmployee.id }
              : undefined
          }
          size="sm"
          onChange={(option) => {
            if (!option) return

            assignUserMutation.mutate({ id: advert.id, userId: option.value })
          }}
        />
        <Box background="white">
          <Input
            name="advert-status"
            readOnly
            value={advert.status.title}
            size="sm"
            label="Staða auglýsingar"
          />
        </Box>

        {shouldShowButton && (
          <Button
            size="small"
            fluid
            icon={isSubmitted ? 'arrowForward' : 'arrowBack'}
            iconType="outline"
            disabled={changeAdvertStatusMutation.isPending}
            onClick={() =>
              changeAdvertStatusMutation.mutate({
                id: advert.id,
                statusId: isSubmitted
                  ? StatusIdEnum.READY_FOR_PUBLICATION
                  : StatusIdEnum.SUBMITTED,
              })
            }
          >
            <Text color="white" variant="small" fontWeight="semiBold">
              {isSubmitted ? 'Færa í tilbúið til útgáfu' : 'Færa í innsent'}
            </Text>
          </Button>
        )}

        <AdvertFormStepper />
      </Stack>
    </Box>
  )
}
