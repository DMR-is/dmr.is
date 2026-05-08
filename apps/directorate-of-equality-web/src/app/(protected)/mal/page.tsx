import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { TabsContainer } from '../../../components/list-page/TabsContent/TabsContainer'

export default function MalPage() {
  return (
    <>
      <Hero
        title="Yfirlit"
        description="Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
        image={{ src: '/assets/banner-image.svg', alt: 'Heildarlisti' }}
        breadcrumbs={{
          items: [{ title: 'Forsíða', href: '/' }, { title: 'Heildarlisti' }],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}

      />
      <Box background="blue100" paddingY={5}>
        <Suspense fallback={<div>Loading...</div>}>
          <TabsContainer />
        </Suspense>
      </Box>
    </>
  )
}
