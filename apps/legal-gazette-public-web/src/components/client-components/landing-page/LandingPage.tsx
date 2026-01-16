'use client'

import { useSession } from 'next-auth/react'

import { Icon } from 'submodules/island.is/libs/island-ui/core/src/lib/IconRC/iconMap'

import { Footer } from '@dmr.is/ui/components/Footer/Footer'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  LinkV2,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { createUrlFromHost } from '@dmr.is/utils/client'

import { SearchIssuesPage } from '../search-issues-page/SearchIssuesPage'

type QuickLink = {
  title: string
  href: string
  variant: 'primary' | 'ghost' | 'text' | 'utility'
  icon?: Icon
}
export const LandingPageContent = () => {
  const { data: session } = useSession()

  const auglysendurUrl = createUrlFromHost(
    window.location.host,
    false,
    'auglysendur',
  )
  const quickLinks: QuickLink[] = [
    {
      title: 'Senda inn auglýsingu',
      href: auglysendurUrl,
      variant: 'primary',
      icon: 'open',
    },
  ]

  if (session) {
    quickLinks.push({
      title: 'Gerast áskrifandi',
      href: '/skraning',
      variant: 'ghost',
      icon: 'pencil',
    })
  }

  return (
    <>
      <Box
        marginBottom={12}
        marginTop={[4, 4, 4, 0]}
        rowGap={8}
        display="flex"
        flexDirection="column"
      >
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <Hero
                title="Lögbirtingablað"
                contentSpan={['12/12', '12/12', '12/12', '7/12']}
                imageSpan={'4/12'}
                withOffset={false}
                image={{ src: '/images/hero-page-image.svg' }}
                description={
                  <Box marginBottom={[2, 2, 2, 2, 0]}>
                    <Text variant="intro">
                      Velkomin á nýja síðu Lögbirtingablaðsins.
                      Dómsmálaráðuneytið gefur út Lögbirtingablaðið. Það kom
                      fyrst út í prentuðu formi í árið 1908 og í dag er blaðið
                      einnig aðgengilegt á netinu þar sem hægt er að nálgast öll
                      tölublöð sem komið hafa út frá 1. janúar 2001.
                    </Text>
                    <Text variant="intro" marginTop={2}>
                      Hér má sjá{' '}
                      <Text
                        color="blue400"
                        fontWeight="medium"
                        as="span"
                        variant="intro"
                      >
                        <LinkV2
                          href="/sidur/leidbeiningar"
                          underlineVisibility="always"
                          underline="normal"
                        >
                          leiðbeiningar
                        </LinkV2>
                      </Text>{' '}
                      fyrir alla vefi Lögbirtingablaðsins.
                    </Text>
                  </Box>
                }
                alignHeader={'spaceBetween'}
              >
                <GridContainer>
                  <GridRow>
                    <GridColumn>
                      <Box marginBottom={6} style={{ marginTop: '-24px' }}>
                        {quickLinks?.map((link, i) => (
                          <Button
                            key={i}
                            size="small"
                            icon={link.icon}
                            iconType="outline"
                            variant={link.variant}
                          >
                            <LinkV2 key={i} href={link.href}>
                              {link.title}
                            </LinkV2>
                          </Button>
                        ))}
                      </Box>
                      <Text>
                        Samkvæmt lögum nr. 15/2005 skal birta í Lögbirtingablaði
                        dómsmálaauglýsingar, svo sem stefnur til dóms, úrskurði
                        um töku búa til opinberra skipta og áskoranir um
                        kröfulýsingar, auglýsingar um skiptafundi og skiptalok
                        þrotabúa, nauðungarsölur, þar á meðal á fasteignum búa
                        sem eru til opinberra skipta, auglýsingar um vogrek,
                        óskilafé og fundið fé, auglýsingar um kaupmála hjóna,
                        lögræðissviptingu og brottfall hennar, lögboðnar
                        auglýsingar um félög og firmu, sérleyfi er stjórnvöld
                        veita, opinber verðlagsákvæði og annað það er
                        stjórnvöldum þykir rétt að birta almenningi.
                      </Text>
                    </GridColumn>
                  </GridRow>
                </GridContainer>
              </Hero>
            </GridColumn>
          </GridRow>
        </GridContainer>

        <Box background="blue100" paddingY={8}>
          <GridContainer>
            <Box marginBottom={4}>
              <Text marginBottom={1} variant="h3">
                Útgefin tölublöð
              </Text>
              <Text>
                Hér er hægt að finna nýjustu tölublöð Lögbirtingablaðsins á PDF
                sniði.
              </Text>
            </Box>
            <SearchIssuesPage />
          </GridContainer>
        </Box>
      </Box>
      <Footer />
    </>
  )
}
