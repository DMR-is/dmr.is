'use client'

import { useSession } from 'next-auth/react'

import { Footer } from '@dmr.is/ui/components/Footer/Footer'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@dmr.is/ui/components/island-is'

import { BannerSearch } from '../../client-components/front-page/banner-search/BannerSearch'
import { SearchIssuesPage } from '../search-issues-page/SearchIssuesPage'

export const LandingPageContent = () => {
  const { data: session } = useSession()
  const quickLinks: React.ComponentProps<typeof BannerSearch>['quickLinks'] =
    session
      ? [
          {
            title: 'Sækja um áskrift',
            href: '/skraning',
            variant: 'blue',
          },
        ]
      : [
          {
            title: 'Umsóknarkerfi auglýsanda',
            href: '/auglysingar?type=innkollun-throtabu',
            variant: 'blue',
          },
        ]

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
                description="Dómsmálaráðuneytið gefur út Lögbirtingablaðið. Það kom fyrst út í prentuðu formi í árið 1908 og í dag er blaðið einnig aðgengilegt á netinu þar sem hægt er að nálgast öll tölublöð sem komið hafa út frá 1. janúar 2001."
                button={quickLinks?.map((link, i) => (
                  <Button key={i} size="small" icon="open" iconType="outline">
                    <LinkV2 key={i} href={link.href}>
                      {link.title}
                    </LinkV2>
                  </Button>
                ))}
                alignHeader={'spaceBetween'}
              >
                <GridContainer>
                  <GridRow>
                    <GridColumn>
                      <Text variant="default">
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
              <Text marginBottom={2} variant="h2">
                Prentuð útgáfa
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
