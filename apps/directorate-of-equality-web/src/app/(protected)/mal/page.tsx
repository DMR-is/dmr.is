'use client'

import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { TabsContainer } from '../../../components/list-page/Tabs/TabsContainer'

export default function MalPage() {
  return (
    <>
      <Hero
        title="Yfirlit"
        description="Yfirlit yfir öll mál sem hafa verið innsend ásamt þeim sem eru í vinnslu hjá Jafnréttisstofu."
        image={{ src: '/assets/banner-image.svg', alt: 'Heildarlisti' }}
        breadcrumbs={{
          items: [{ title: 'Forsíða', href: '/' }, { title: 'Heildarlisti' }],
        }}
        variant="default"
        reverse
      />
      <Box background="blue100" paddingY={5}>
        <Suspense>
          <TabsContainer />
        </Suspense>
      </Box>
    </>
  )
}
