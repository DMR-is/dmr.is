'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Link,
  LinkContext,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { HeaderLogo } from '../Header/HeaderLogo'

export const Footer = () => {
  const hlekkir = [
    {
      title: 'Auglýsingarflokkar',
      href: '/auglysingar?type=innkollun-throtabu',
    },
    {
      title: 'Gjaldskrá',
      href: '/gjaldskra',
    },
    {
      title: 'Um Lögbirtingablaðið',
      href: '/about',
    },
    {
      title: 'Áskriftarskilmálar',
      href: '/skilmalar',
    },
    {
      title: 'Leiðbeiningar',
      href: '/leidbeiningar',
    },
    {
      title: 'Gerast áskrifandi',
      href: '/skraning',
    },
  ]

  const adridVefir = [
    {
      title: 'Umsóknarkerfi auglýsanda',
      href: '/auglysingar?type=innkollun-throtabu',
    },
    {
      title: 'Stjórnartíðindi',
      href: 'https://island.is/stjornartidindi',
    },
  ]

  return (
    <footer>
      <Box width="full" background="blue100" paddingY={6}>
        <GridContainer>
          <GridRow>
            <GridColumn span="4/12">
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
              <div
                style={{
                  borderLeft: '1px solid #ccdfff',
                  height: '100%',
                  position: 'absolute',
                  top: '0',
                  right: '20px',
                }}
              />
            </GridColumn>

            <GridColumn span="6/12">
              <Stack space={2}>
                <Text variant="eyebrow" color="dark350" paddingTop={4}>
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
          </GridRow>
        </GridContainer>
      </Box>
      <Box paddingY={4}>
        <GridContainer>
          <Box paddingBottom={2}>
            <Text variant="eyebrow" color="dark350">
              Aðrir vefir
            </Text>
          </Box>
          <Box>
            <LinkContext.Provider
              value={{
                linkRenderer: (href, children) => (
                  <Link href={href} underline="normal">
                    {children}
                  </Link>
                ),
              }}
            >
              <Inline space={[2, 2, 4]}>
                {adridVefir.map(({ title, href }, index) => (
                  <Text key={index} variant="small" color="blue600">
                    <a href={href}>{title}</a>
                  </Text>
                ))}
              </Inline>
            </LinkContext.Provider>
          </Box>
        </GridContainer>
      </Box>
    </footer>
  )
}
