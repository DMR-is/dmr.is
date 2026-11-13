import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { NoticeIssuesContainer } from '../../../containers/notice-issues/NoticeIssuesContainer'
import { requireNavAccess } from '../../../lib/auth/requireNavAccess'
import { NAV_PATHS } from '../../../lib/constants'
import { headerText, noticeIssuesText } from '../../../lib/text'

export default async function TilkynningarPage() {
  await requireNavAccess(NAV_PATHS.tilkynningar)

  return (
    <Box height="full">
      <Hero
        title={noticeIssuesText.heroTitle}
        description={noticeIssuesText.heroDescription}
        image={{
          src: '/assets/image-with-text-1.svg',
          alt: noticeIssuesText.heroImageAlt,
        }}
        breadcrumbs={{
          items: [
            {
              title: headerText.brand,
              href: NAV_PATHS.frontpage.href,
            },
            { title: NAV_PATHS.tilkynningar.title },
          ],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} style={{ minHeight: '100%' }}>
        <Suspense fallback={<SearchDashboardLoading />}>
          <NoticeIssuesContainer />
        </Suspense>
      </Box>
    </Box>
  )
}
