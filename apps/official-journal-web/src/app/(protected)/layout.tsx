'use client'

import { Page } from '@dmr.is/ui/components/island-is/Page'

import { Header } from '../../components/header/Header'
import { Main } from '../../components/main/Main'
import { PageLoader } from '../../components/page-loader/page-loader'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PageLoader />
      <Page component="div">
        <Header />
        <Main>{children}</Main>
      </Page>
    </>
  )
}
