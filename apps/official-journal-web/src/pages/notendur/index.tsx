import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'

import { BaseEntity } from '../../gen/fetch'
import { LayoutProps } from '../../layout/Layout'
import { getDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

const DynamicUsersPage = dynamic(() => import('../../components/pages/Users'))

type Props = {
  isAdmin: boolean
  roleOptions: { label: string; value: BaseEntity }[]
}

export default function UsersPage({ isAdmin, roleOptions }: Props) {
  return <DynamicUsersPage isAdmin={isAdmin} roleOptions={roleOptions} />
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

  const isAdmin = session.user.role.slug === 'ritstjori'

  const client = getDmrClient(session.idToken)

  const { roles } = await client.getRolesByUser()

  const layout: LayoutProps = {
    showFooter: false,
    bannerProps: {
      showBanner: true,
      variant: 'small',
      title: isAdmin ? 'Umsjón notenda og stofnana' : 'Umsjón notenda',
      description: isAdmin
        ? 'Hér er hægt að sjá og breyta notendum og stofnunum.'
        : 'Hér er hægt að sjá og breyta notendum.',
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
      isAdmin: isAdmin,
      roleOptions: roles.map((role) => ({
        label: role.title,
        value: role,
      })),
    }),
  }
}
