import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { UsersContainer } from '../../../containers/users/UsersContainer'

export default function RitstjorarPage() {
  return (
    <Box height="full">
      <Hero
        title="Ritstjórar"
        description="Hér eru skráðir ritstjórar kerfisins. Hægt er að bæta við nýjum ritstjóra, breyta upplýsingum eða gera ritstjóra óvirkan."
        image={{ src: '/assets/banner-image.svg', alt: 'Ritstjórar' }}
        breadcrumbs={{
          items: [{ title: 'Forsíða', href: '/' }, { title: 'Ritstjórar' }],
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
