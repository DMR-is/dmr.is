'use client'

import Hero from '@dmr.is/ui/components/Hero/Hero'

import { Route, Routes } from '../../../lib/constants'
import { routesToBreadcrumbs } from '../../../lib/utils'
import CaseFilters from '../CaseFilters/CaseFilters'

export const RitstjornHero = () => {
  const breadcrumbs = routesToBreadcrumbs(Routes, Route.RITSTJORN)

  return (
    <Hero
      breadcrumbs={{ items: breadcrumbs }}
      variant="small"
      title="Vinnslusvæði Lögbirtingablaðs"
      description="Forem ipsum dolor sit ameåt, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
      image={{
        src: '/assets/banner-image-small-2.svg',
        alt: 'Image alt',
      }}
    >
      <CaseFilters />
    </Hero>
  )
}
