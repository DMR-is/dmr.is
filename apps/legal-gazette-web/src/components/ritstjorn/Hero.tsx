'use client'

import Hero from '@dmr.is/ui/components/Hero/Hero'

import { Route, Routes } from '../../lib/constants'
import { routesToBreadcrumbs } from '../../lib/utils'

export const RitstjornHero = () => {
  const breadcrumbs = routesToBreadcrumbs(Routes, Route.RITSTJORN)

  return (
    <Hero
      breadcrumbs={{ items: breadcrumbs }}
      variant="small"
      title="Ritsjórn Lögbirtingablaðs"
      description="Vinnslusvæði fyrir ritsjórn Lögbirtingablaðs."
      image={{
        src: '/assets/banner-image-small-2.svg',
        alt: 'Image alt',
      }}
    >
      <div></div>
    </Hero>
  )
}
