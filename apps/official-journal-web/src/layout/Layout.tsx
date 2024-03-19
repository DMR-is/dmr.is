import { Footer, Page } from '@island.is/island-ui/core'

import { Header } from '../components/header/Header'
import { Main } from '../components/main/Main'
// eslint-disable-next-line @typescript-eslint/naming-convention
import Head from 'next/head'

import type { Screen } from '../lib/types'
import { Banner } from '../components/banner/Banner'
import { messages } from '../lib/messages'
import { ComponentProps } from 'react'

const mockBannerCards = [
  {
    title: messages.components.frontpageBanner.cards.editorial.title,
    text: messages.components.frontpageBanner.cards.editorial.description,
    link: '/ritstjorn',
    image: '/assets/ritstjorn-image.svg',
  },
  {
    title: messages.components.frontpageBanner.cards.publishing.title,
    text: messages.components.frontpageBanner.cards.publishing.description,
    link: '/ritstjorn',
    image: '/assets/utgafa-image.svg',
  },
  {
    title: messages.components.frontpageBanner.cards.all.title,
    text: messages.components.frontpageBanner.cards.all.description,
    link: '/ritstjorn',
    image: '/assets/heildar-image.svg',
  },
]

type BannerProps = ComponentProps<typeof Banner> & {
  showBanner?: boolean
}

type LayoutProps = {
  children?: React.ReactNode
  showFooter?: boolean
  bannerProps?: BannerProps
}

const Layout: Screen<LayoutProps> = ({
  children,
  showFooter = false,
  bannerProps = { showBanner: true },
}) => {
  const preloadedFonts = [
    '/fonts/ibm-plex-sans-v7-latin-300.woff2',
    '/fonts/ibm-plex-sans-v7-latin-regular.woff2',
    '/fonts/ibm-plex-sans-v7-latin-italic.woff2',
    '/fonts/ibm-plex-sans-v7-latin-500.woff2',
    '/fonts/ibm-plex-sans-v7-latin-600.woff2',
  ]

  return (
    <Page component="div">
      <Head>
        {preloadedFonts.map((href, index) => {
          return (
            <link
              key={index}
              rel="preload"
              href={href}
              as="font"
              type="font/woff2"
              crossOrigin="anonymous"
            />
          )
        })}
      </Head>
      <Header />
      <Main>
        {bannerProps.showBanner && (
          <Banner
            title={bannerProps.title}
            description={bannerProps.description}
            imgSrc={bannerProps.imgSrc}
            cards={bannerProps.cards}
            fontSize={bannerProps.fontSize}
          />
        )}
        {children}
      </Main>
      {showFooter && <Footer />}
      <style jsx global>{`
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 300;
          font-display: swap;
          src: local('IBM Plex Sans Light'), local('IBMPlexSans-Light'),
            url('/fonts/ibm-plex-sans-v7-latin-300.woff2') format('woff2'),
            url('/fonts/ibm-plex-sans-v7-latin-300.woff') format('woff');
        }
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: local('IBM Plex Sans'), local('IBMPlexSans'),
            url('/fonts/ibm-plex-sans-v7-latin-regular.woff2') format('woff2'),
            url('/fonts/ibm-plex-sans-v7-latin-regular.woff') format('woff');
        }
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: italic;
          font-weight: 400;
          font-display: swap;
          src: local('IBM Plex Sans Italic'), local('IBMPlexSans-Italic'),
            url('/fonts/ibm-plex-sans-v7-latin-italic.woff2') format('woff2'),
            url('/fonts/ibm-plex-sans-v7-latin-italic.woff') format('woff');
        }
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 500;
          font-display: swap;
          src: local('IBM Plex Sans Medium'), local('IBMPlexSans-Medium'),
            url('/fonts/ibm-plex-sans-v7-latin-500.woff2') format('woff2'),
            url('/fonts/ibm-plex-sans-v7-latin-500.woff') format('woff');
        }
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: local('IBM Plex Sans SemiBold'), local('IBMPlexSans-SemiBold'),
            url('/fonts/ibm-plex-sans-v7-latin-600.woff2') format('woff2'),
            url('/fonts/ibm-plex-sans-v7-latin-600.woff') format('woff');
        }
      `}</style>
    </Page>
  )
}

Layout.getProps = async ({ req, res, query }) => {}

type LayoutWrapper<T> = Screen<{ layoutProps: LayoutProps; componentProps: T }>

export const withMainLayout = <T,>(
  Component: Screen<T>,
  layoutConfig: Partial<LayoutProps> = {},
): LayoutWrapper<T> => {
  const WithMainLayout: LayoutWrapper<T> = ({
    layoutProps,
    componentProps,
  }) => {
    return (
      <Layout {...layoutProps}>
        {/**
         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
         // @ts-ignore make web strict */}
        <Component {...componentProps} />
      </Layout>
    )
  }

  WithMainLayout.getProps = async (ctx) => {
    // Configure default full-page caching.
    // if (ctx.res) {
    //   ctx.res.setHeader('Cache-Control', CACHE_CONTROL_HEADER)
    // }

    const getLayoutProps = Layout.getProps as Exclude<
      typeof Layout.getProps,
      undefined
    >

    const [layoutProps, componentProps] = await Promise.all([
      getLayoutProps(ctx),
      Component.getProps ? Component.getProps(ctx) : ({} as T),
    ])

    return {
      layoutProps: {
        ...layoutProps,
        ...layoutConfig,
      },
      componentProps,
    }
  }

  return WithMainLayout
}
