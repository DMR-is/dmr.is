'use client'

import dynamic from 'next/dynamic'

const DynamicSelect = dynamic(
  () => import('@island.is/island-ui/core/Select/Select').then((mod) => mod.Select),
  {
    ssr: false,
  },
)

export const Select = DynamicSelect
