import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState } from 'react'
import { AuthMiddleware } from '@dmr.is/middleware'
import { CreateAdminUser } from '@dmr.is/shared/dto'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Icon,
  Inline,
  Input,
  Select,
  SkeletonLoader,
  Stack,
  Tag,
} from '@island.is/island-ui/core'

import { ContentWrapper } from '../../components/content-wrapper/ContentWrapper'
import { Section } from '../../components/section/Section'
import { UpdateAdminUser } from '../../components/users/UpdateAdminUser'
import {
  AdminUser,
  AdminUserRole,
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
    isLoadingUsers,
    createUser,
    isCreatingUser,
    updateUser,
    isUpdatingUser,
    deleteUser,
    isDeletingUser,
  } = useAdminUsers({
    onCreateError: (error) => console.error(error),
    onUpdateError: (error) => console.error(error),
    onDeleteError: (error) => console.error(error),
    onUpdateSuccess: () => {
      setUpdateUserState({
        id: '',
        email: '',
        displayName: '',
        firstName: '',
        lastName: '',
        roleIds: [],
      })
    },
  })

  const [createUserState, setCreateUserState] = useState<CreateAdminUser>({
    nationalId: '',
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    roleIds: [],
  })

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

  const usersOptions = users?.flatMap((user) => {
    if (user.nationalId === currentUser.nationalId) {
      return []
    }

    return {
      label: user.displayName,
      value: user,
    }
  })

  const rolesOptions = roles.map((role) => ({
    label: role.title,
    value: role,
  }))

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
                <Stack space={[2, 2, 3]}>
                  <Input
                    name="create-user-national-id"
                    size="sm"
                    type="number"
                    label="Kennitala"
                    backgroundColor="blue"
                    value={createUserState.nationalId}
                    onChange={(e) =>
                      setCreateUserState({
                        ...createUserState,
                        nationalId: e.target.value,
                      })
                    }
                  />
                  <Input
                    name="create-user-email"
                    size="sm"
                    type="email"
                    label="Netfang"
                    backgroundColor="blue"
                    value={createUserState.email}
                    onChange={(e) =>
                      setCreateUserState({
                        ...createUserState,
                        email: e.target.value,
                      })
                    }
                  />
                  <Input
                    name="create-user-first-name"
                    size="sm"
                    label="Fornafn"
                    backgroundColor="blue"
                    value={createUserState.firstName}
                    onChange={(e) =>
                      setCreateUserState({
                        ...createUserState,
                        firstName: e.target.value,
                      })
                    }
                  />
                  <Input
                    name="create-user-last-name"
                    size="sm"
                    label="Eftirnafn"
                    backgroundColor="blue"
                    value={createUserState.lastName}
                    onChange={(e) =>
                      setCreateUserState({
                        ...createUserState,
                        lastName: e.target.value,
                      })
                    }
                  />
                  <Input
                    name="create-user-user-name"
                    size="sm"
                    label="Notendanafn"
                    backgroundColor="blue"
                    value={createUserState.displayName}
                    onChange={(e) =>
                      setCreateUserState({
                        ...createUserState,
                        displayName: e.target.value,
                      })
                    }
                  />
                  <Select
                    size="sm"
                    label="Hlutverk"
                    backgroundColor="blue"
                    options={rolesOptions}
                    defaultValue={rolesOptions[0]}
                    onChange={(opt) => {
                      if (!opt?.value) return

                      if (createUserState.roleIds.includes(opt.value.id)) {
                        setCreateUserState({
                          ...createUserState,
                          roleIds: createUserState.roleIds.filter(
                            (id) => id !== opt.value.id,
                          ),
                        })
                      } else {
                        setCreateUserState({
                          ...createUserState,
                          roleIds: createUserState.roleIds.concat(opt.value.id),
                        })
                      }
                    }}
                  />
                  <Inline space={2} flexWrap="wrap">
                    {createUserState.roleIds.map((roleId) => {
                      const role = roles.find((r) => r.id === roleId)

                      return (
                        <Tag
                          outlined
                          key={role?.id}
                          onClick={() =>
                            setCreateUserState({
                              ...createUserState,
                              roleIds: createUserState.roleIds.filter(
                                (id) => id !== roleId,
                              ),
                            })
                          }
                        >
                          <Box
                            display="flex"
                            justifyContent="flexStart"
                            alignItems="center"
                            columnGap="smallGutter"
                          >
                            <span>{role?.title}</span>
                            <Icon size="small" icon="close" />
                          </Box>
                        </Tag>
                      )
                    })}
                  </Inline>
                  <Inline justifyContent="flexEnd" space={2}>
                    <Button
                      loading={isCreatingUser}
                      onClick={() => createUser(createUserState)}
                      variant="ghost"
                      size="small"
                      icon="person"
                      iconType="outline"
                    >
                      Stofna notanda
                    </Button>
                  </Inline>
                </Stack>
              )}
            </ContentWrapper>
          </GridColumn>
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
