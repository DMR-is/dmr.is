import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState } from 'react'
import { AuthMiddleware } from '@dmr.is/middleware'

import {
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { ContentWrapper } from '../../components/content-wrapper/ContentWrapper'
import { Section } from '../../components/section/Section'
import { OJOISelect } from '../../components/select/OJOISelect'
import { CreateAdminUser } from '../../components/users/CreateAdminUser'
import { CreateApplicationUser } from '../../components/users/CreateApplicationUser'
import { CreateInstitution } from '../../components/users/CreateInstitution'
import { UpdateAdminUser } from '../../components/users/UpdateAdminUser'
import { UpdateApplicationUser } from '../../components/users/UpdateApplicationUser'
import { UpdateInstitution } from '../../components/users/UpdateInstitution'
import {
  AdminUser,
  AdminUserRole,
  CreateAdminUser as CreateAdminUserDto,
  CreateApplicationUser as CreateApplicationUserDto,
  CreateInstitution as CreateInstitutionDto,
  Institution,
  UpdateApplicationUser as UpdateApplicationUserDto,
} from '../../gen/fetch'
import { useAdminUsers, useInstitutions } from '../../hooks/api'
import { useApplicationUsers } from '../../hooks/api/useApplicationUsers'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { loginRedirect } from '../../lib/utils'

type Props = {
  currentUser: AdminUser | null
  roles: AdminUserRole[]
}

export default function UsersPage({ currentUser, roles }: Props) {
  const [
    selectedApplicationUserInstitution,
    setSelectedApplicationUserInstitution,
  ] = useState<Institution | null>(null)

  const [selectedAdminUser, setSelectedAdminUser] = useState<AdminUser | null>(
    null,
  )

  const [createApplicationUserState, setCreateApplicationUserState] =
    useState<CreateApplicationUserDto>({
      nationalId: '',
      firstName: '',
      lastName: '',
      email: '',
      involvedPartyIds: [],
    })

  const [updateApplicationUserState, setUpdateApplicationUserState] = useState<
    UpdateApplicationUserDto & { id: string }
  >({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    involvedPartyIds: [],
  })

  const [createInstitutionState, setCreateInstitutionState] =
    useState<CreateInstitutionDto>({
      title: '',
    })

  const [updateInstitutionState, setUpdateInstitutionState] =
    useState<Institution>({
      id: '',
      title: '',
      slug: '',
    })

  const { users, getUsers, isLoadingUsers, isUsersValidating } = useAdminUsers({
    config: {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  })

  const {
    applicationUsers,
    applicationUsersLoading,
    createApplicationUser,
    isCreatingApplicationUser,
    updateApplicationUser,
    isUpdatingApplicationUser,
    deleteApplicationUser,
    isDeletingApplicationUser,
  } = useApplicationUsers({
    searchParams: {
      involvedParty: selectedApplicationUserInstitution?.id,
    },
    config: {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
    onUpdateSuccess: ({ user }) => {
      setUpdateApplicationUserState({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        involvedPartyIds: user.involvedParties.map((inst) => inst.id),
      })
    },
    onCreateSuccess: () => {
      resetCreateApplicationUserState()
      getUsers()
    },
    onDeleteSuccess: () => {
      resetUpdateApplicationUserState()
      getUsers()
    },
  })

  const {
    institutions,
    createInstitution,
    deleteInstitution,
    getInstitutions,
    isCreatingInstitution,
    isDeletingInstitution,
    isLoadingInstitutions,
    isUpdatingInstitution,
    updateInstitution,
  } = useInstitutions({
    config: {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
    searchParams: {
      search: undefined,
      page: 1,
      pageSize: 1000,
    },
    onCreateSuccess: () => {
      setCreateInstitutionState({ title: '' })
      getInstitutions()
    },
    onDeleteSuccess: () => {
      setUpdateInstitutionState({ id: '', title: '', slug: '' })
      getInstitutions()
    },
    onUpdateSuccess: () => {
      setUpdateInstitutionState({ id: '', title: '', slug: '' })
      getInstitutions()
    },
  })

  const resetUpdateApplicationUserState = () => {
    setUpdateApplicationUserState({
      id: '',
      email: '',
      firstName: '',
      lastName: '',
      involvedPartyIds: [],
    })
  }

  const resetCreateApplicationUserState = () => {
    setCreateApplicationUserState({
      nationalId: '',
      firstName: '',
      lastName: '',
      email: '',
      involvedPartyIds: [],
    })
  }

  const usersOptions = users?.flatMap((user) => {
    if (user.nationalId === currentUser?.nationalId) {
      return []
    }

    return {
      label: user.displayName,
      value: user,
    }
  })

  const institutionsOptions = institutions?.institutions?.map(
    (institution) => ({
      label: institution.title,
      value: institution,
    }),
  )

  const applicationUsersOptions = applicationUsers?.map((user) => ({
    label: `${user.firstName} (${user.lastName})`,
    value: user,
  }))

  return (
    <Section variant="blue">
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12']} paddingBottom={[2, 2, 3]}>
            <Text variant="h3">Umsjón notenda og stofnana</Text>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={[2, 2, 3]}>
          <GridColumn
            span={['12/12', '12/12', '6/12']}
            paddingBottom={[2, 2, 3]}
          >
            <ContentWrapper title="Notendur ritstjórnar">
              <Stack space={[2, 2, 3]}>
                <OJOISelect
                  isClearable
                  isLoading={isLoadingUsers || isUsersValidating}
                  size="sm"
                  label="Notandi"
                  placeholder="Veldu ristjóra"
                  backgroundColor="blue"
                  options={usersOptions}
                  value={usersOptions?.find(
                    (opt) => opt.value.id === selectedAdminUser?.id,
                  )}
                  onChange={(opt) =>
                    opt
                      ? setSelectedAdminUser(opt.value)
                      : setSelectedAdminUser(null)
                  }
                />
                <UpdateAdminUser
                  user={selectedAdminUser}
                  roles={roles}
                  onDeleteSuccess={() => {
                    setSelectedAdminUser(null)
                    getUsers()
                  }}
                  onUpdatedSuccess={() => getUsers()}
                />
              </Stack>
            </ContentWrapper>
          </GridColumn>
          <GridColumn
            span={['12/12', '12/12', '6/12']}
            paddingBottom={[2, 2, 3]}
          >
            <ContentWrapper title="Stofna ritstjóra">
              {isLoadingUsers ? (
                <SkeletonLoader height={40} />
              ) : (
                <CreateAdminUser
                  roles={roles}
                  onCreateSuccess={() => {
                    getUsers()
                  }}
                />
              )}
            </ContentWrapper>
          </GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '6/12']}
            paddingBottom={[2, 2, 3]}
          >
            <ContentWrapper title="Notendur umsóknarkerfis">
              <Stack space={[2, 2, 3]}>
                <OJOISelect
                  isClearable
                  size="sm"
                  label="Stofnun"
                  placeholder="Veldu stofnun til þess að sjá notendur"
                  backgroundColor="blue"
                  options={institutionsOptions}
                  onChange={(opt) => {
                    if (!opt?.value) {
                      setSelectedApplicationUserInstitution(null)
                      resetUpdateApplicationUserState()
                      return
                    }

                    setSelectedApplicationUserInstitution(opt.value)
                  }}
                />
                <OJOISelect
                  isClearable
                  noOptionsMessage="Engir notendur eru skráðir fyrir þessa stofnun"
                  isLoading={applicationUsersLoading}
                  size="sm"
                  label="Notandi"
                  placeholder="Veldu notanda"
                  backgroundColor="blue"
                  options={applicationUsersOptions}
                  onChange={(opt) => {
                    if (!opt?.value) {
                      resetUpdateApplicationUserState()
                      return
                    }
                    const institutionIds = opt.value.involvedParties.map(
                      (inst) => inst.id,
                    )
                    setUpdateApplicationUserState({
                      id: opt.value.id,
                      email: opt.value.email,
                      firstName: opt.value.firstName,
                      lastName: opt.value.lastName,
                      involvedPartyIds: institutionIds,
                    })
                  }}
                />
                <UpdateApplicationUser
                  user={updateApplicationUserState}
                  institutions={institutions?.institutions || []}
                  isUpdatingUser={isUpdatingApplicationUser}
                  isDeletingUser={isDeletingApplicationUser}
                  onChangeUser={(user) => setUpdateApplicationUserState(user)}
                  onUpdateUser={(user) => updateApplicationUser(user)}
                  onDeleteUser={(user) => deleteApplicationUser(user.id)}
                />
              </Stack>
            </ContentWrapper>
          </GridColumn>
          <GridColumn
            span={['12/12', '12/12', '6/12']}
            paddingBottom={[2, 2, 3]}
          >
            <ContentWrapper title="Stofna innsendanda">
              <CreateApplicationUser
                user={createApplicationUserState}
                institutions={institutions?.institutions || []}
                isCreatingUser={isCreatingApplicationUser}
                onUpdateUser={(user) => setCreateApplicationUserState(user)}
                onCreateUser={(user) => createApplicationUser(user)}
              />
            </ContentWrapper>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={[2, 2, 3]}>
          <GridColumn span={['12/12', '12/12', '6/12']}>
            <ContentWrapper title="Stofnanir">
              <Stack space={[2, 2, 3]}>
                <OJOISelect
                  isClearable
                  isLoading={isLoadingInstitutions}
                  size="sm"
                  label="Stofnun"
                  placeholder="Veldu stofnun"
                  backgroundColor="blue"
                  options={institutionsOptions}
                  onChange={(opt) => {
                    if (!opt?.value) {
                      setSelectedApplicationUserInstitution(null)
                      resetUpdateApplicationUserState()
                      return
                    }

                    setUpdateInstitutionState(opt.value)
                  }}
                />
                <UpdateInstitution
                  isUpdating={isUpdatingInstitution}
                  isDeleting={isDeletingInstitution}
                  institution={updateInstitutionState}
                  onChange={(institution) =>
                    setUpdateInstitutionState(institution)
                  }
                  onUpdate={() =>
                    updateInstitution({
                      id: updateInstitutionState.id,
                      title: updateInstitutionState.title,
                    })
                  }
                  onDelete={() =>
                    deleteInstitution({ id: updateInstitutionState.id })
                  }
                />
              </Stack>
            </ContentWrapper>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '6/12']}>
            <ContentWrapper title="Stofna stofnun">
              <CreateInstitution
                institution={createInstitutionState}
                isCreating={isCreatingInstitution}
                onUpdate={(institution) =>
                  setCreateInstitutionState(institution)
                }
                onCreate={(institution) => createInstitution(institution)}
              />
            </ContentWrapper>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  resolvedUrl,
}) => {
  const session = await getSession({ req })
  const client = createDmrClient()

  const layout: LayoutProps = {
    showFooter: false,
    headerWhite: true,
    bannerProps: {
      showBanner: false,
    },
  }

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const roles = await client
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getRoles()

  return {
    props: {
      layout,
      currentUser: session.user,
      roles: roles.roles,
    },
  }
}
