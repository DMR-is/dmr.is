import { GetServerSideProps } from 'next'
import { signIn } from 'next-auth/react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { LayoutProps } from '../layout/Layout'
import { Routes } from '../lib/constants'
import { identityServerId } from '../lib/identityProvider'
import { messages } from '../lib/messages/caseOverview'

type Props = {
  prevUrl?: string
}

export default function Login({ prevUrl }: Props) {
  return (
    <GridContainer>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn
          paddingBottom={[2, 2, 3]}
          offset={['0', '1/12']}
          span={['12/12', '5/12']}
        >
          <Box component="img" src="/assets/image-with-text-1.svg" />
        </GridColumn>
        <GridColumn paddingBottom={[2, 2, 3]} span={['12/12', '5/12']}>
          <Box
            display="flex"
            flexDirection="column"
            height="full"
            justifyContent="center"
          >
            <Stack space={2}>
              <Text variant="h2">Innskráning</Text>
              <Text variant="intro">
                Skráðu þig inn hér með rafrænum skilríkjum.
              </Text>
              <Box marginTop={[2, 2, 3]}>
                <Button
                  onClick={() =>
                    signIn(identityServerId, { callbackUrl: prevUrl })
                  }
                  icon="person"
                  iconType="outline"
                >
                  Skrá inn með rafrænum skilríkjum
                </Button>
              </Box>
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

// <Box display="flex" columnGap={2}>
//   <Button
//     onClick={() => signIn(identityServerId, { callbackUrl: '/' })}
//   >
//     IDS
//   </Button>
export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
}) => {
  if (process.env.NODE_ENV !== 'development') {
    // TODO: Disable this in production
    // return {
    //   notFound: true,
    // }
  }

  const callbackUrl = query.callbackUrl ? query.callbackUrl : '/'

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
  return { props: { layout, prevUrl: callbackUrl as string } }
}
