import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { UsersContainer } from '../../../containers/users/UsersContainer'
import { NAV_PATHS } from '../../../lib/constants'
import { usersText } from '../../../lib/text'

export default function RitstjorarPage() {
  return (
    <Box height="full">
      <Hero
        title={usersText.heroTitle}
        description={usersText.heroDescription}
        image={{ src: '/assets/banner-image.svg', alt: usersText.heroTitle }}
        breadcrumbs={{
          items: [
            {
              title: NAV_PATHS.frontpage.title,
              href: NAV_PATHS.frontpage.href,
            },
            {
              title: NAV_PATHS.ritstjorn.title,
              href: NAV_PATHS.ritstjorn.href,
            },
          ],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} height="full">
        <Suspense fallback={<SearchDashboardLoading />}>
          <UsersContainer />
        </Suspense>
      </Box>
    </Box>
  )
}
