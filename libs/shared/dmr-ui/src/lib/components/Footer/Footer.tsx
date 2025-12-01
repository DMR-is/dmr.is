'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  LinkV2,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { HeaderLogo } from '../Header/HeaderLogo'
import * as styles from './footer.css'

export const Footer = ({ type = 'outer' }: { type?: 'outer' | 'inner' }) => {
  const hlekkir = [
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

  const adridVefirOuter = [
    {
      title: 'Umsóknarkerfi Lögbirtingarblaðs',
      href: 'https://umsoknir.legal-gazette.dev.dmr-dev.cloud/innskraning?callbackUrl=%2Fumsoknir',
    },
    {
      title: 'Stjórnartíðindi',
      href: 'https://island.is/stjornartidindi',
    },
  ]

  const adridVefirInner = [
    {
      title: 'Vefur Lögbirtingablaðs',
      href: 'https://legal-gazette.dev.dmr-dev.cloud',
    },
    {
      title: 'Stjórnartíðindi',
      href: 'https://island.is/stjornartidindi',
    },
  ]

  const adridVefir = type === 'outer' ? adridVefirOuter : adridVefirInner

  return (
    <footer>
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

            {type === 'outer' && (
              <GridColumn span={['12/12', '6/12', '6/12', '6/12']}>
                <Stack space={2}>
                  <Text variant="eyebrow" color="blue400" paddingTop={4}>
                    Hlekkir
                  </Text>
                  <Inline space={8}>
                    <Stack space={1}>
                      {hlekkir.map(
                        ({ title, href }, index) =>
                          index < 4 && (
                            <Text key={index} variant="small" color="blue600">
                              <a href={href}>{title}</a>
                            </Text>
                          ),
                      )}
                    </Stack>
                    <Stack space={1}>
                      {hlekkir.map(
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
            )}
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
              {adridVefir.map(({ title, href }) => (
                <LinkV2 href={href} underline="normal" newTab>
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
