import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'
import { Section } from '@dmr.is/ui'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

import { LayoutProps } from '../../layout/Layout'
import { getDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

const UserTable = dynamic(() => import('../../components/tables/UsersTable'))

type Props = {
  involvedParties: { label: string; value: string }[]
  roleOptions: { label: string; value: string }[]
}

export default function UsersPage({ involvedParties, roleOptions }: Props) {
  return (
    <Section>
      <GridContainer>
        <GridRow>
          <GridColumn
            offset={['0', '1/12']}
            span={['12/12', '10/12']}
            paddingBottom={[2, 2, 3]}
          >
            <Stack space={[2, 2, 3]}>
              <UserTable
                involvedPartyOptions={involvedParties}
                roleOptions={roleOptions}
              />
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

  const client = getDmrClient(session.accessToken)

  const { involvedParties } = await client.getInvolvedPartiesByUser()
  const { roles } = await client.getRolesByUser()

  const layout: LayoutProps = {
    showFooter: false,
    headerWhite: true,
    bannerProps: {
      showBanner: true,
      variant: 'small',
      title: 'Notendur',
      description: 'Umsýsla og umsjón notenda',
      breadcrumbs: [
        {
          title: 'Stjórnartíðindi',
          href: Routes.Dashboard,
        },
        {
          title: 'Umsjón notenda',
        },
      ],
      imgSrc: '/assets/banner-small-image.svg',
    },
  }

  return {
    props: deleteUndefined({
      session,
      layout,
      roleOptions: roles.map((role) => ({
        label: role.title,
        value: role.slug,
      })),
      involvedParties: involvedParties.map((party) => ({
        label: party.title,
        value: party.slug,
      })),
    }),
  }
}
