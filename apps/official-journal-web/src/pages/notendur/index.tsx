import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState } from 'react'
import { AuthMiddleware } from '@dmr.is/middleware'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Select,
  SkeletonLoader,
  Stack,
} from '@island.is/island-ui/core'

import { ContentWrapper } from '../../components/content-wrapper/ContentWrapper'
import { Section } from '../../components/section/Section'
import { CreateAdminUser } from '../../components/users/CreateAdminUser'
import { UpdateAdminUser } from '../../components/users/UpdateAdminUser'
import {
  AdminUser,
  AdminUserRole,
  CreateAdminUser as CreateAdminUserDto,
  UpdateAdminUser as UpdateAdminUserDto,
} from '../../gen/fetch'
import { useAdminUsers } from '../../hooks/api'
import { createDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'

type Props = {
  currentUser: AdminUser
  roles: AdminUserRole[]
}

export default function UsersPage({ currentUser, roles }: Props) {
  const {
    users,
    getUsers,
    isLoadingUsers,
    createUser,
    isCreatingUser,
    updateUser,
    isUpdatingUser,
    deleteUser,
    isDeletingUser,
  } = useAdminUsers({
    onUpdateSuccess: () => {
      resetUpdateState()
    },
    onCreateSuccess: () => {
      resetCreateState()
      getUsers()
    },
    onDeleteSuccess: () => {
      resetUpdateState()
      getUsers()
    },
  })

  const [createUserState, setCreateUserState] = useState<CreateAdminUserDto>({
    nationalId: '',
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    roleIds: [],
  })

  const resetCreateState = () => {
    setCreateUserState({
      nationalId: '',
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      roleIds: [],
    })
  }

  const [updateUserState, setUpdateUserState] = useState<
    UpdateAdminUserDto & { id: string }
  >({
    id: '',
    email: '',
    displayName: '',
    firstName: '',
    lastName: '',
    roleIds: [],
  })

  const resetUpdateState = () => {
    setUpdateUserState({
      id: '',
      email: '',
      displayName: '',
      firstName: '',
      lastName: '',
      roleIds: [],
    })
  }

  const usersOptions = users?.flatMap((user) => {
    if (user.nationalId === currentUser.nationalId) {
      return []
    }

    return {
      label: user.displayName,
      value: user,
    }
  })

  return (
    <Section>
      <GridContainer>
        <GridRow rowGap={[2, 2, 3]}>
          <GridColumn span={['12/12', '12/12', '6/12']}>
            <ContentWrapper title="Breyta ritstjóra">
              {isLoadingUsers ? (
                <SkeletonLoader space={[2, 2, 3]} repeat={5} height={40} />
              ) : (
                <Stack space={[2, 2, 3]}>
                  <Select
                    size="sm"
                    label="Ritstjóri"
                    placeholder="Veldu ritstjóra"
                    backgroundColor="blue"
                    options={usersOptions}
                    onChange={(opt) => {
                      if (!opt?.value) return

                      const user = opt.value

                      setUpdateUserState({
                        id: user.id,
                        email: user.email,
                        displayName: user.displayName,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        roleIds: user.roles.map((role) => role.id),
                      })
                    }}
                  />
                  <UpdateAdminUser
                    user={updateUserState}
                    roles={roles}
                    isUpdatingUser={isUpdatingUser}
                    isDeletingUser={isDeletingUser}
                    onUserChange={(user) => setUpdateUserState(user)}
                    onUpdateUser={updateUser}
                    onDeleteUser={deleteUser}
                  />
                </Stack>
              )}
            </ContentWrapper>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '6/12']}>
            <ContentWrapper title="Stofna nýjan ritstjóra">
              {isLoadingUsers ? (
                <SkeletonLoader height={40} />
              ) : (
                <CreateAdminUser
                  isCreatingUser={isCreatingUser}
                  user={createUserState}
                  roles={roles}
                  onUpdateCreateUser={(user) => setCreateUserState(user)}
                  onCreateUser={createUser}
                />
              )}
            </ContentWrapper>
          </GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '6/12']}></GridColumn>
          <GridColumn span={['12/12', '12/12', '6/12']}></GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  const client = createDmrClient()

  if (!session) {
    return {
      redirect: {
        destination: Routes.Login,
        permanent: false,
      },
    }
  }

  const roles = await client
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getRoles()

  return {
    props: {
      currentUser: session.user,
      roles: roles.roles,
    },
  }
}
