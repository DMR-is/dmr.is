'use client'

import dynamic from 'next/dynamic'

import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { Suspense } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'

import { Banner } from '../../../../components/banner/Banner'
import { Section } from '../../../../components/section/Section'
import { UserProvider } from '../../../../context/userContext'
import { UserRoleDto } from '../../../../gen/fetch'
import { Routes } from '../../../../lib/constants'

const UserTable = dynamic(() => import('../../../../components/tables/UsersTable'))
const InstitutionTable = dynamic(
  () => import('../../../../components/tables/InstitutionTable'),
)

type Props = {
  isAdmin: boolean
  roleOptions: { label: string; value: UserRoleDto }[]
}

export function UsersPageClient({ isAdmin, roleOptions }: Props) {
  const [selectedTab, setSelectedTab] = useQueryState(
    'tab',
    parseAsString.withDefault('notendur'),
  )

  const [_page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))

  const tabs = [
    {
      id: 'notendur',
      label: 'Notendur',
      content: (
        <Box background="white" padding={[2, 3]}>
          <UserTable isAdmin={isAdmin} roleOptions={roleOptions} />
        </Box>
      ),
    },
  ]

  const institutionTab = {
    id: 'stofnanir',
    label: 'Stofnanir',
    content: (
      <Box background="white" padding={[2, 3]}>
        <InstitutionTable />
      </Box>
    ),
  }

  if (isAdmin) {
    tabs.push(institutionTab)
  }

  return (
    <>
      <Banner
        title={isAdmin ? 'Umsjón notenda og stofnana' : 'Umsjón notenda'}
        description={
          isAdmin
            ? 'Hér er hægt að sjá og breyta notendum og stofnunum.'
            : 'Hér er hægt að sjá og breyta notendum.'
        }
        variant="small"
        imgSrc="/assets/banner-small-image.svg"
        breadcrumbs={[
          {
            title: 'Stjórnartíðindi',
            href: Routes.Dashboard,
          },
          {
            title: 'Umsjón notenda',
          },
        ]}
      />
      <Suspense>
        <UserProvider>
          <Section>
            <GridContainer>
              <GridRow>
                <GridColumn
                  offset={['0', '1/12']}
                  span={['12/12', '10/12']}
                  paddingBottom={[2, 2, 3]}
                >
                  {isAdmin ? (
                    <Tabs
                      tabs={tabs}
                      selected={selectedTab}
                      onChange={(id) => {
                        setSelectedTab(id)
                        setPage(1)
                      }}
                      label=""
                    />
                  ) : (
                    <UserTable isAdmin={isAdmin} roleOptions={roleOptions} />
                  )}
                </GridColumn>
              </GridRow>
            </GridContainer>
          </Section>
        </UserProvider>
      </Suspense>
    </>
  )
}
