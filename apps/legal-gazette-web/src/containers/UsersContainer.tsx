'use client'

import { useQueryStates } from 'nuqs'
import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import {
  GridColumn,
  GridContainer,
  GridRow,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'

import { TRPCErrorAlert } from '../components/trpc/TRPCErrorAlert'
import { CreateUser } from '../components/users/CreateUser'
import { DeleteUser } from '../components/users/DeleteUser'
import { UpdateUser } from '../components/users/UpdateUser'
import { UsersTable } from '../components/users/UsersTable'
import { pagingParams } from '../lib/nuqs/paging-params'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export const UsersContainer = () => {
  const [params, setParams] = useQueryStates(pagingParams)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery(
    trpc.getUsers.queryOptions(params),
  )

  const [shouldResetCreateState, setShouldResetCreateState] = useState(false)
  const [shouldResetUpdateState, setShouldResetUpdateState] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  const { mutate: createUserMutation, isPending: isCreatingUser } = useMutation(
    trpc.createUser.mutationOptions({
      onMutate: async () => {
        setShouldResetCreateState(false)
        await queryClient.cancelQueries(trpc.getUsers.queryFilter())
      },
      onSuccess: (data, _) => {
        toast.success(`Notandi ${data.name} búinn til`)
        setShouldResetCreateState(true)
        setIsCreateModalOpen(true)
        queryClient.invalidateQueries(trpc.getUsers.queryFilter())
      },
      onError: (_err, _, context) => {
        toast.error(`Ekki tókst að búa til notanda`)

        if (context) {
          queryClient.setQueryData(trpc.getUsers.queryKey(params), context)
        }
      },
    }),
  )

  const { mutate: deleteUserMutation, isPending: isDeletingUser } = useMutation(
    trpc.deleteUser.mutationOptions({
      onMutate: async () => {
        await queryClient.cancelQueries(trpc.getUsers.queryFilter())
      },
      onSuccess: () => {
        toast.success(`Notandi eytt`)
        queryClient.invalidateQueries(trpc.getUsers.queryFilter())
      },
      onError: () => {
        toast.error(`Ekki tókst að eyða notanda`)
      },
    }),
  )

  const { mutate: updateUserMutation, isPending: isUpdatingUser } = useMutation(
    trpc.updateUser.mutationOptions({
      onMutate: async () => {
        setShouldResetUpdateState(false)
        await queryClient.cancelQueries(trpc.getUsers.queryFilter())
      },
      onSuccess: () => {
        toast.success(`Notandi uppfærður`)
        setShouldResetUpdateState(true)
        setIsUpdateModalOpen(true)
        queryClient.invalidateQueries(trpc.getUsers.queryFilter())
      },
      onError: () => {
        toast.error(`Ekki tókst að eyða notanda`)
      },
    }),
  )

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]} marginBottom={[2, 3]}>
        <GridColumn paddingTop={[2, 3]} span="12/12">
          <Hero
            title="Stillingar fyrir ritstjóra Lögbirtingablaðsins"
            variant="small"
            image={{ src: '/assets/banner-small-image.svg', alt: '' }}
            centerImage={true}
          >
            <Text>
              Hér er hægt að eiga við ritstjóra Lögbirtingablaðsins. Hægt er að
              bæta við, uppfæra og eyða ritstjórum. Ritstjórar hafa aðgang að
              ritstjórnarkerfinu og geta birt auglýsingar.
            </Text>
          </Hero>
        </GridColumn>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          {error && <TRPCErrorAlert error={error} />}
          <UsersTable
            loading={isPending}
            users={data?.users.map((us) => ({
              id: us.id,
              name: us.name,
              email: us.email,
              nationalId: us.nationalId,
              actions: [
                <UpdateUser
                  intiallyVisible={false}
                  isUpdatingUser={isUpdatingUser}
                  shouldReset={shouldResetUpdateState}
                  shouldClose={isUpdateModalOpen}
                  onUpdateUser={(user) =>
                    updateUserMutation({ userId: us.id, ...user })
                  }
                />,
                <DeleteUser
                  loading={isDeletingUser}
                  onDelete={() => deleteUserMutation({ id: us.id })}
                />,
              ],
            }))}
            actionButton={
              <CreateUser
                intiallyVisible={false}
                shouldReset={shouldResetCreateState}
                shouldClose={isCreateModalOpen}
                onCreateUser={createUserMutation}
                isCreatingUser={isCreatingUser}
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
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
