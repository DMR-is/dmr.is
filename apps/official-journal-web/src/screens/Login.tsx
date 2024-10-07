import { signIn } from 'next-auth/react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { withMainLayout } from '../layout/Layout'
import { Routes } from '../lib/constants'
import { messages } from '../lib/messages/caseOverview'
import { Screen } from '../lib/types'

const Login: Screen = () => {
  const handleLogin = (id: string) => {
    signIn('kennitala', {
      callbackUrl: '/',
      nationalId: id,
    })
  }

  return (
    <GridContainer>
      <GridRow rowGap={['p2', 3]}>
        <GridColumn
          paddingTop={2}
          offset={['0', '0', '0', '1/12']}
          span={['12/12', '12/12', '12/12', '10/12']}
        >
          <Box display="flex" columnGap={2}>
            <Button onClick={() => handleLogin('0101857799')}>Ármann</Button>
            <Button onClick={() => handleLogin('0101876689')}>Pálína</Button>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

// Login.getProps = async ({ query }) => {
//   console.log('Login.getProps', query)
// }

export default withMainLayout(Login, {
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
})
