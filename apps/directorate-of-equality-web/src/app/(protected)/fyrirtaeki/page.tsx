import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { CompaniesContainer } from '../../../containers/companies/CompaniesContainer'

export default async function FyrirtaekiPage() {
  return (
    <Box height="full">
      <Hero
        title="Fyrirtæki"
        description="Hér eru skráð fyrirtæki í kerfinu. Hægt er að leita að fyrirtækjum, sía eftir stærð og skoða stöðu jafnréttismála."
        image={{ src: '/assets/banner-image.svg', alt: 'Fyrirtæki' }}
        breadcrumbs={{
          items: [{ title: 'Forsíða', href: '/' }, { title: 'Fyrirtæki' }],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} height="full">
        <Suspense fallback={<SearchDashboardLoading />}>
          <CompaniesContainer />
        </Suspense>
      </Box>
    </Box>
  )
}
