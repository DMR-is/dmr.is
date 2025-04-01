import dynamic from 'next/dynamic'
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'next-usequerystate'
import { Section } from '@dmr.is/ui/components/Section/Section'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Tabs,
} from '@island.is/island-ui/core'

import { UserProvider } from '../../context/userContext'
import { BaseEntity } from '../../gen/fetch'

const UserTable = dynamic(() => import('../tables/UsersTable'))
const InstitutionTable = dynamic(() => import('../tables/InstitutionTable'))

type Props = {
  isAdmin: boolean
  roleOptions: { label: string; value: BaseEntity }[]
}

export default function UsersPage({ isAdmin, roleOptions }: Props) {
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
  )
}
