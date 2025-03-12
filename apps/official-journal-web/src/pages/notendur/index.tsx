import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'
import { Section } from '@dmr.is/ui'

import {
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
} from '@island.is/island-ui/core'

import { BaseEntity } from '../../gen/fetch'
import { LayoutProps } from '../../layout/Layout'
import { getDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

const UserTable = dynamic(() => import('../../components/tables/UsersTable'))

type Props = {
  involvedParties: { label: string; value: BaseEntity }[]
  roleOptions: { label: string; value: BaseEntity }[]
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
              <Inline space={2}>
                <Button icon="person" iconType="outline" variant="utility">
                  Stofna ritstjóra
                </Button>
                <Button
                  icon="accessibility"
                  iconType="outline"
                  variant="utility"
                >
                  Stofna fulltrúa
                </Button>
                <Button icon="document" iconType="outline" variant="utility">
                  Stofna innsendanda
                </Button>
              </Inline>
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
        value: role,
      })),
      involvedParties: involvedParties.map((party) => ({
        label: party.title,
        value: party,
      })),
    }),
  }
}
