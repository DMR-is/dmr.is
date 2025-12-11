'use client'

import { usePathname } from 'next/navigation'

import { useMemo } from 'react'

import { Breadcrumbs as BreadcrumbsUI } from '@dmr.is/ui/components/island-is'

import { PageRoutes } from '../../../lib/constants'

export const Breadcrumbs = () => {
  const path = usePathname()

  const items = useMemo(() => {
    const paths = []
    paths.push({
      title: 'Lögbirtingarblaðið',
      href: PageRoutes.FORSIDA,
    })

    if (path.includes('/auglysingar')) {
      paths.push({
        title: 'Auglýsingar',
        href: PageRoutes.AUGLYSINGAR,
      })
    }

    return paths
  }, [path])

  return <BreadcrumbsUI items={items} />
}
