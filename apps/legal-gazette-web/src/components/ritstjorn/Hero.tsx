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
      description="Vinnslusvæði fyrir ritsjórn Lögbirtingablaðs. Lögbirtingablað hefur verið gefið út á prenti frá 2. Janúar 1908 en rafræn útgáfa hófst 1. júlí 2005."
      image={{
        src: '/assets/banner-image-small-2.svg',
        alt: 'Image alt',
      }}
    >
      <div></div>
    </Hero>
  )
}
