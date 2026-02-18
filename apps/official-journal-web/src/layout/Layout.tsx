import Head from 'next/head'

import { ComponentProps } from 'react'
import { IntlProvider } from 'react-intl'
import { SWRConfig } from 'swr'

import { Footer } from '@dmr.is/ui/components/island-is/Footer'
import { Page } from '@dmr.is/ui/components/island-is/Page'
import { ToastContainer } from '@dmr.is/ui/components/island-is/ToastContainer'
import { globalStyles } from '@dmr.is/ui/globalStyles'

import Banner from '../components/banner/Banner'
import { Header } from '../components/header/Header'
import { Main } from '../components/main/Main'
import { PageLoader } from '../components/page-loader/page-loader'
import icelandic from '../i18n/strings/is-compiled.json'
import { defaultFetcher } from '../lib/constants'

globalStyles()


type BannerProps = ComponentProps<typeof Banner> & {
  showBanner?: boolean
}

export type LayoutProps = {
  children?: React.ReactNode
  headerWhite?: boolean
  showFooter?: boolean
  bannerProps?: BannerProps
}

export const Layout = ({
  children,
  headerWhite,
  showFooter = false,
  bannerProps = {
    showBanner: true,
    enableCategories: false,
    enableDepartments: false,
    enableTypes: false,
    statuses: [],
  },
}: LayoutProps) => {
  const preloadedFonts = [
    '/fonts/ibm-plex-sans-v7-latin-300.woff2',
    '/fonts/ibm-plex-sans-v7-latin-regular.woff2',
    '/fonts/ibm-plex-sans-v7-latin-italic.woff2',
    '/fonts/ibm-plex-sans-v7-latin-500.woff2',
    '/fonts/ibm-plex-sans-v7-latin-600.woff2',
  ]

  return (
    <IntlProvider
      locale="is"
      defaultLocale="is"
      messages={icelandic}
      onError={(err) => {
        // Chrome only ships with 'en' formatters for NumberFormat and DateTimeFormat.
        // Ignore these errors since we're not using these formatters.
        // Bundling polyfills for 'is' significantly increases bundle size and provides no gain.
        // See: https://app.asana.com/0/1202453499137756/1204509391926816
        if (err.code === 'MISSING_DATA') {
          return null
        }

        // eslint-disable-next-line no-console
        console.error('Error in IntlProvider', { exception: err })
      }}
    >
      <SWRConfig
        value={{
          fetcher: defaultFetcher,
          refreshInterval: 1000 * 60,
          shouldRetryOnError: false,
          suspense: false,
        }}
      >
          <PageLoader />
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
            <Header headerWhite={headerWhite} />
            <Main>
              {bannerProps.showBanner && (
                <Banner
                  title={bannerProps.title}
                  description={bannerProps.description}
                  imgSrc={bannerProps.imgSrc}
                  variant={bannerProps.variant}
                  cards={bannerProps.cards}
                  breadcrumbs={bannerProps.breadcrumbs}
                  contentColumnSpan={bannerProps.contentColumnSpan}
                  imageColumnSpan={bannerProps.imageColumnSpan}
                  enableCategories={bannerProps.enableCategories}
                  enableDepartments={bannerProps.enableDepartments}
                  statuses={bannerProps.statuses}
                  enableTypes={bannerProps.enableTypes}
                  enableSearch={bannerProps.enableSearch}
                />
              )}
              {children}
              <ToastContainer />
            </Main>
            {showFooter && <Footer />}
            <style jsx global>{`
              @font-face {
                font-family: 'IBM Plex Sans';
                font-style: normal;
                font-weight: 300;
                font-display: swap;
                src:
                  local('IBM Plex Sans Light'),
                  local('IBMPlexSans-Light'),
                  url('/fonts/ibm-plex-sans-v7-latin-300.woff2') format('woff2'),
                  url('/fonts/ibm-plex-sans-v7-latin-300.woff') format('woff');
              }
              @font-face {
                font-family: 'IBM Plex Sans';
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src:
                  local('IBM Plex Sans'),
                  local('IBMPlexSans'),
                  url('/fonts/ibm-plex-sans-v7-latin-regular.woff2')
                    format('woff2'),
                  url('/fonts/ibm-plex-sans-v7-latin-regular.woff')
                    format('woff');
              }
              @font-face {
                font-family: 'IBM Plex Sans';
                font-style: italic;
                font-weight: 400;
                font-display: swap;
                src:
                  local('IBM Plex Sans Italic'),
                  local('IBMPlexSans-Italic'),
                  url('/fonts/ibm-plex-sans-v7-latin-italic.woff2')
                    format('woff2'),
                  url('/fonts/ibm-plex-sans-v7-latin-italic.woff')
                    format('woff');
              }
              @font-face {
                font-family: 'IBM Plex Sans';
                font-style: normal;
                font-weight: 500;
                font-display: swap;
                src:
                  local('IBM Plex Sans Medium'),
                  local('IBMPlexSans-Medium'),
                  url('/fonts/ibm-plex-sans-v7-latin-500.woff2') format('woff2'),
                  url('/fonts/ibm-plex-sans-v7-latin-500.woff') format('woff');
              }
              @font-face {
                font-family: 'IBM Plex Sans';
                font-style: normal;
                font-weight: 600;
                font-display: swap;
                src:
                  local('IBM Plex Sans SemiBold'),
                  local('IBMPlexSans-SemiBold'),
                  url('/fonts/ibm-plex-sans-v7-latin-600.woff2') format('woff2'),
                  url('/fonts/ibm-plex-sans-v7-latin-600.woff') format('woff');
              }
            `}</style>
          </Page>
      </SWRConfig>
    </IntlProvider>
  )
}
