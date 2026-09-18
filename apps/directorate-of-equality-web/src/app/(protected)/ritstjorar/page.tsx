import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { UsersContainer } from '../../../containers/users/UsersContainer'
import { requireNavAccess } from '../../../lib/auth/requireNavAccess'
import { NAV_PATHS } from '../../../lib/constants'
import { headerText, sharedText, usersText } from '../../../lib/text'

export default async function RitstjorarPage() {
  await requireNavAccess(NAV_PATHS.ritstjorn)

  return (
    <Box height="full">
      <Hero
        title={usersText.heroTitle}
        description={usersText.heroDescription}
        image={{
          src: '/assets/image-with-text-1.svg',
          alt: usersText.heroTitle,
        }}
        breadcrumbs={{
          items: [
            {
              title: headerText.brand,
              href: NAV_PATHS.frontpage.href,
            },
            { title: sharedText.admin },
          ],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} style={{ minHeight: '100%' }}>
        <Suspense fallback={<SearchDashboardLoading />}>
          <UsersContainer />
        </Suspense>
      </Box>
    </Box>
  )
}
