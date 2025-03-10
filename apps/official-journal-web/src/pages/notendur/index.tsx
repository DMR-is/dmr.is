import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { useState } from 'react'

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
  ApplicationUser,
  Institution,
} from '../../gen/fetch'
import { useAdminUsers, useInstitutions } from '../../hooks/api'
import { useApplicationUsers } from '../../hooks/api/useApplicationUsers'
import { LayoutProps } from '../../layout/Layout'
import { getDmrClient } from '../../lib/api/createClient'
import { loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

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

  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null)

  const [selectedApplicationUser, setSelectedApplicationUser] =
    useState<ApplicationUser | null>(null)

  const { users, getUsers, isLoadingUsers, isUsersValidating } = useAdminUsers()

  const { getApplicationUsers, applicationUsers, applicationUsersLoading } =
    useApplicationUsers({
      searchParams: {
        involvedParty: selectedApplicationUserInstitution?.id,
      },
      config: {
        refreshInterval: 0,
        revalidateOnFocus: false,
      },
    })

  const { institutions, getInstitutions, isLoadingInstitutions } =
    useInstitutions({
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
        getInstitutions()
      },
      onDeleteSuccess: () => {
        getInstitutions()
      },
      onUpdateSuccess: () => {
        getInstitutions()
      },
    })

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
                    if (!opt) {
                      setSelectedApplicationUserInstitution(null)
                      setSelectedApplicationUser(null)
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
                    if (!opt) {
                      return setSelectedApplicationUser(null)
                    }

                    setSelectedApplicationUser(opt.value)
                  }}
                />
                <UpdateApplicationUser
                  user={selectedApplicationUser}
                  institutions={institutions?.institutions || []}
                  onDeleteSuccess={() => {
                    setSelectedApplicationUser(null)
                    getApplicationUsers()
                  }}
                  onUpdateSuccess={() => {
                    getApplicationUsers()
                  }}
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
                institutions={institutions?.institutions || []}
                onCreateSuccess={() => getApplicationUsers()}
              />
            </ContentWrapper>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={[2, 2, 3]}>
          <GridColumn span={['12/12', '12/12', '6/12']}>
            <ContentWrapper title="Stofnanir">
              <Stack space={[2, 2, 3]}>
                <OJOISelect
                  key={selectedInstitution?.id}
                  isClearable
                  isLoading={isLoadingInstitutions}
                  size="sm"
                  label="Stofnun"
                  placeholder="Veldu stofnun"
                  backgroundColor="blue"
                  options={institutionsOptions}
                  value={institutionsOptions?.find(
                    (opt) => opt.value.id === selectedInstitution?.id,
                  )}
                  onChange={(opt) => {
                    if (!opt) {
                      setSelectedInstitution(null)
                      return
                    }

                    setSelectedInstitution(opt.value)
                  }}
                />
                <UpdateInstitution
                  institution={selectedInstitution}
                  onDeleteSuccess={() => {
                    setSelectedInstitution(null)
                    getInstitutions()
                  }}
                  onUpdateSuccess={() => getInstitutions()}
                />
              </Stack>
            </ContentWrapper>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '6/12']}>
            <ContentWrapper title="Stofna stofnun">
              <CreateInstitution onCreateSuccess={() => getInstitutions()} />
            </ContentWrapper>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  resolvedUrl,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }
  const client = getDmrClient(session.accessToken)

  const layout: LayoutProps = {
    showFooter: false,
    headerWhite: true,
    bannerProps: {
      showBanner: false,
    },
  }

  const roles = await client.getRoles()

  return {
    props: {
      session,
      layout,
      roles: roles.roles,
    },
  }
}
