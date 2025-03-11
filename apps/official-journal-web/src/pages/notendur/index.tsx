import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { Section } from '../../components/section/Section'
import { LayoutProps } from '../../layout/Layout'
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

const UserTable = dynamic(() => import('../../components/tables/UsersTable'))

export default function UsersPage() {
  return (
    <Section variant="blue">
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12']} paddingBottom={[2, 2, 3]}>
            <Stack space={[2, 2, 3]}>
              <Text variant="h3">Umsjón notenda og stofnana</Text>
              <UserTable />
            </Stack>
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

  const layout: LayoutProps = {
    showFooter: false,
    headerWhite: true,
    bannerProps: {
      showBanner: false,
    },
  }

  return {
    props: deleteUndefined({
      session,
      layout,
    }),
  }
}
