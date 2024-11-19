import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { signIn } from 'next-auth/react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { LayoutProps } from '../layout/Layout'
import { Routes } from '../lib/constants'
import { identityServerId } from '../lib/identityProvider'
import { messages } from '../lib/messages/caseOverview'

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = {}

export default function Login(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  data: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <GridContainer>
      <GridRow rowGap={['p2', 3]}>
        <GridColumn
          paddingTop={2}
          offset={['0', '0', '0', '1/12']}
          span={['12/12', '12/12', '12/12', '10/12']}
        >
          <Box display="flex" columnGap={2}>
            <Button
              onClick={() => signIn(identityServerId, { callbackUrl: '/' })}
            >
              IDS
            </Button>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (process.env.NODE_ENV !== 'development') {
    // TODO: Disable this in production
    // return {
    //   notFound: true,
    // }
  }
  const layout: LayoutProps = {
    showFooter: true,
    bannerProps: {
      showBanner: false,
      showFilters: false,
      imgSrc: '/assets/banner-publish-image.svg',
      title: messages.banner.title,
      description: messages.banner.description,
      variant: 'small',
      contentColumnSpan: ['12/12', '12/12', '5/12'],
      imageColumnSpan: ['12/12', '12/12', '5/12'],
      breadcrumbs: [
        {
          title: messages.breadcrumbs.dashboard,
          href: Routes.Dashboard,
        },
        {
          title: messages.breadcrumbs.casePublishing,
        },
      ],
    },
  }
  return { props: { layout } }
}
