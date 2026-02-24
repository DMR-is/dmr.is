'use client'

import { usePathname, useSearchParams } from 'next/navigation'

import React, { useEffect, useRef } from 'react'
import { LoadingBarRef } from 'react-top-loading-bar'

import { PageLoader as PageLoaderUI } from '@dmr.is/ui/components/island-is/PageLoader'

export const PageLoader = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ref = useRef<LoadingBarRef>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    ref.current?.continuousStart()
    const timer = setTimeout(() => {
      ref.current?.complete()
    }, 200)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return <PageLoaderUI ref={ref} />
}

export default PageLoader
