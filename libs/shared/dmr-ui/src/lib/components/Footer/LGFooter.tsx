'use client'

import { Box } from '../../island-is/lib/Box'
import { GridColumn } from '../../island-is/lib/GridColumn'
import { GridContainer } from '../../island-is/lib/GridContainer'
import { GridRow } from '../../island-is/lib/GridRow'
import { Inline } from '../../island-is/lib/Inline'
import { LinkV2 } from '../../island-is/lib/LinkV2'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
import { HeaderLogo } from '../Header/HeaderLogo'
import * as styles from './footer.css'
type LGFooterProps = {
  site?: 'web' | 'applications'
}

export const LGFooter = ({ site = 'web' }: LGFooterProps) => {
  const otherLogbirtingSite = `https://${site === 'web' ? 'auglysendur.' : ''}logbirtingablad.is`
  const stjornartidindiUrl = 'https://island.is/stjornartidindi'

  const innerLinks =
    site === 'web'
      ? [
          {
            title: 'Auglýsingarflokkar',
            href: '/sidur/auglysingaflokkar',
          },
          {
            title: 'Gjaldskrá',
            href: '/sidur/gjaldskra',
          },
          {
            title: 'Um Lögbirtingablaðið',
            href: '/sidur/about',
          },
          {
            title: 'Áskriftarskilmálar',
            href: '/sidur/skilmalar',
          },
          {
            title: 'Útgefin tölublöð',
            href: '/sidur/utgefintolublod',
          },
          {
            title: 'Leiðbeiningar',
            href: '/sidur/leidbeiningar',
          },
          {
            title: 'Gerast áskrifandi',
            href: '/skraning',
          },
        ]
      : site === 'applications'
        ? [
            {
              title: 'Leiðbeiningar',
              href: otherLogbirtingSite + '/sidur/leidbeiningar',
            },
            {
              title: 'Auglýsingarflokkar',
              href: otherLogbirtingSite + '/sidur/auglysingaflokkar',
            },

            {
              title: 'Um Lögbirtingablaðið',
              href: otherLogbirtingSite + '/sidur/about',
            },
          ]
        : []

  const externalLinks =
    site === 'web'
      ? [
          {
            title: 'Auglýsendakerfi Lögbirtingablaðsins',
            href: otherLogbirtingSite,
          },
          {
            title: 'Stjórnartíðindi',
            href: stjornartidindiUrl,
          },
        ]
      : site === 'applications'
        ? [
            {
              title: 'Vefur Lögbirtingablaðs',
              href: otherLogbirtingSite,
            },
            {
              title: 'Stjórnartíðindi',
              href: stjornartidindiUrl,
            },
          ]
        : []

  return (
    <footer className={styles.footerContainer}>
      <Box width="full" background="blue100" paddingY={6}>
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '12/12', '6/12', '4/12']}>
              <Inline alignY="top" space={3}>
                <HeaderLogo />
                <Stack space={2}>
                  <Text as="h2" variant="h2" paddingTop={2} color="dark400">
                    Lögbirtingablað
                  </Text>

                  <Stack space={1}>
                    <Text variant="small" color="dark400">
                      Sýslumaðurinn á Suðurlandi
                    </Text>
                    <Text variant="small" color="dark400">
                      Ránarbraut 1, 870 Vík
                    </Text>
                    <Text variant="small" color="dark400">
                      <a href="tel:4582800">458-2800</a>
                    </Text>
                    <Text variant="small" color="dark400">
                      <a href="mailto:logbirtingabladid@syslumenn.is">
                        logbirtingabladid@syslumenn.is
                      </a>
                    </Text>
                  </Stack>
                </Stack>
              </Inline>

              <div className={styles.footerDivider} />
            </GridColumn>

            {/* {site === 'web' && ( */}
            <GridColumn span={['12/12', '6/12', '6/12', '6/12']}>
              <Stack space={2}>
                <Text variant="eyebrow" color="blue400" paddingTop={4}>
                  Hlekkir
                </Text>
                <Inline space={8}>
                  <Stack space={1}>
                    {innerLinks.map(
                      ({ title, href }, index) =>
                        index < 4 && (
                          <Text key={index} variant="small" color="blue600">
                            <a href={href}>{title}</a>
                          </Text>
                        ),
                    )}
                  </Stack>
                  <Stack space={1}>
                    {innerLinks.map(
                      ({ title, href }, index) =>
                        index >= 4 && (
                          <Text key={index} variant="small" color="blue600">
                            <a href={href}>{title}</a>
                          </Text>
                        ),
                    )}
                  </Stack>
                </Inline>
              </Stack>
            </GridColumn>
            {/* )} */}
          </GridRow>
        </GridContainer>
      </Box>
      <Box paddingY={4}>
        <GridContainer>
          <Box paddingBottom={2}>
            <Text variant="eyebrow" color="blue400">
              Aðrir vefir
            </Text>
          </Box>
          <Box>
            <Inline space={[2, 2, 4]}>
              {externalLinks.map(({ title, href }) => (
                <LinkV2 href={href} key={title} underline="normal" newTab>
                  <Text variant="small" color="blue600">
                    {title}
                  </Text>
                </LinkV2>
              ))}
            </Inline>
          </Box>
        </GridContainer>
      </Box>
    </footer>
  )
}
