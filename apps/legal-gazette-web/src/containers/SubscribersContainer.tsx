'use client'

import { useQueryStates } from 'nuqs'
import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import {
  Checkbox,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'

import { CreateSubscriberModal } from '../components/subscribers/CreateSubscriberModal'
import { SubscribersTable } from '../components/subscribers/SubscribersTable'
import { UpdateSubscriberModal } from '../components/subscribers/UpdateSubscriberModal'
import { TRPCErrorAlert } from '../components/trpc/TRPCErrorAlert'
import { pagingParams } from '../lib/nuqs/paging-params'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export const SubscribersContainer = () => {
  const [params, setParams] = useQueryStates(pagingParams)
  const [includeInactive, setIncludeInactive] = useState(false)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery(
    trpc.getSubscribers.queryOptions({
      ...params,
      includeInactive,
    }),
  )

  const [shouldResetCreateState, setShouldResetCreateState] = useState(false)
  const [shouldResetUpdateState, setShouldResetUpdateState] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  const { mutate: createSubscriberMutation, isPending: isCreatingSubscriber } =
    useMutation(
      trpc.createSubscriber.mutationOptions({
        onMutate: async () => {
          setShouldResetCreateState(false)
          await queryClient.cancelQueries(trpc.getSubscribers.queryFilter())
        },
        onSuccess: (data) => {
          toast.success(`Áskrifandi ${data.name} búinn til`)
          setShouldResetCreateState(true)
          setIsCreateModalOpen(true)
          queryClient.invalidateQueries(trpc.getSubscribers.queryFilter())
        },
        onError: () => {
          toast.error(`Ekki tókst að búa til áskrifanda`)
        },
      }),
    )

  const {
    mutate: deactivateSubscriberMutation,
    isPending: isDeactivatingSubscriber,
  } = useMutation(
    trpc.deactivateSubscriber.mutationOptions({
      onMutate: async () => {
        await queryClient.cancelQueries(trpc.getSubscribers.queryFilter())
      },
      onSuccess: () => {
        toast.success(`Áskrifandi gerður óvirkur`)
        queryClient.invalidateQueries(trpc.getSubscribers.queryFilter())
      },
      onError: () => {
        toast.error(`Ekki tókst að gera áskrifanda óvirkan`)
      },
    }),
  )

  const {
    mutate: updateSubscriberMutation,
    isPending: isUpdatingSubscriber,
  } = useMutation(
    trpc.updateSubscriberEndDate.mutationOptions({
      onMutate: async () => {
        setShouldResetUpdateState(false)
        await queryClient.cancelQueries(trpc.getSubscribers.queryFilter())
      },
      onSuccess: () => {
        toast.success(`Áskrift uppfærð`)
        setShouldResetUpdateState(true)
        setIsUpdateModalOpen(true)
        queryClient.invalidateQueries(trpc.getSubscribers.queryFilter())
      },
      onError: () => {
        toast.error(`Ekki tókst að uppfæra áskrift`)
      },
    }),
  )

  const {
    mutate: activateSubscriberMutation,
    isPending: isActivatingSubscriber,
  } = useMutation(
    trpc.activateSubscriber.mutationOptions({
      onMutate: async () => {
        await queryClient.cancelQueries(trpc.getSubscribers.queryFilter())
      },
      onSuccess: () => {
        toast.success(`Áskrifandi virkjaður`)
        queryClient.invalidateQueries(trpc.getSubscribers.queryFilter())
      },
      onError: () => {
        toast.error(`Ekki tókst að virkja áskrifanda`)
      },
    }),
  )

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]} marginBottom={[2, 3]}>
        <GridColumn paddingTop={[2, 3]} span="12/12">
          <Hero
            title="Stillingar fyrir áskrifendur Lögbirtingablaðsins"
            variant="small"
            image={{ src: '/assets/banner-small-image.svg', alt: '' }}
            centerImage={true}
            breadcrumbs={{
              items: [
                {
                  title: 'Stjórnborð',
                  href: '/',
                },
                {
                  title: 'Áskrifendur',
                  href: '/stillingar/askrifendur',
                },
              ],
            }}
          >
            <Text>
              Hér er hægt að skoða og stjórna áskrifendum Lögbirtingablaðsins.
              Hægt er að bæta við áskrifendum handvirkt, breyta gildistíma
              áskrifta og afvirkja áskrifendur.
            </Text>
          </Hero>
        </GridColumn>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Stack space={3}>
            <Checkbox
              label="Sýna óvirka áskrifendur"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            {error && <TRPCErrorAlert error={error} />}
            <SubscribersTable
              loading={isPending}
              subscribers={data?.subscribers.map((sub) => ({
                id: sub.id,
                name: sub.name,
                email: sub.email,
                nationalId: sub.nationalId,
                isActive: sub.isActive,
                subscribedFrom: sub.subscribedFrom,
                subscribedTo: sub.subscribedTo,
                actions: [
                  <UpdateSubscriberModal
                    key="update"
                    initiallyVisible={false}
                    isUpdatingSubscriber={isUpdatingSubscriber}
                    shouldReset={shouldResetUpdateState}
                    shouldClose={isUpdateModalOpen}
                    currentEndDate={sub.subscribedTo}
                    isActive={sub.isActive}
                    isActivating={isActivatingSubscriber}
                    isDeactivating={isDeactivatingSubscriber}
                    onUpdateSubscriber={(data) =>
                      updateSubscriberMutation({
                        subscriberId: sub.id,
                        subscribedTo: data.subscribedTo,
                      })
                    }
                    onActivate={() =>
                      activateSubscriberMutation({ subscriberId: sub.id })
                    }
                    onDeactivate={() =>
                      deactivateSubscriberMutation({ subscriberId: sub.id })
                    }
                  />,
                ],
              }))}
              actionButton={
                <CreateSubscriberModal
                  initiallyVisible={false}
                  shouldReset={shouldResetCreateState}
                  shouldClose={isCreateModalOpen}
                  onCreateSubscriber={createSubscriberMutation}
                  isCreatingSubscriber={isCreatingSubscriber}
                />
              }
              paging={data?.paging}
              onPageChange={(page) =>
                setParams((prev) => ({ ...prev, page: page }))
              }
              onPageSizeChange={(pageSize) =>
                setParams((prev) => ({ ...prev, pageSize }))
              }
            />
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
