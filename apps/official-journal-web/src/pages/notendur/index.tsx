import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getSession } from 'next-auth/react'
import { Section } from '@dmr.is/ui'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { LayoutProps } from '../../layout/Layout'
import { loginRedirect } from '../../lib/utils'

const UsersTable = dynamic(() => import('../../components/tables/UsersTable'))

export default function UsersPage() {
  return (
    <Section>
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12']} paddingBottom={[2, 2, 3]}>
            <Stack space={2}>
              <Text variant="h3">Umsjón notenda og stofnana</Text>
              <UsersTable />
            </Stack>
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

  return {
    props: {
      layout,
      currentUser: session.user,
    },
  }
}
