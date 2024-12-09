import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { USER_ROLES } from '@dmr.is/constants'

import { Routes } from '../../lib/constants'

type Props = {}

export default function UsersPage() {
  return <div></div>
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })

  if (!session) {
    return {
      redirect: {
        destination: Routes.Login,
        permanent: false,
      },
    }
  }

  session.user.roles.some((role) => role.title === USER_ROLES.Admin)

  return {
    props: {},
  }
}
