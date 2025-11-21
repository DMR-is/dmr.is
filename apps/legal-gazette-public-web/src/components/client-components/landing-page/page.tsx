'use client'

import { Footer } from '@dmr.is/ui/components/Footer/Footer'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { Icon, Inline, Link, LinkContext } from '@island.is/island-ui/core'

import { BannerSearch } from '../../client-components/front-page/banner-search/BannerSearch'
import { SearchIssuesResults } from '../search-issues-page/results/SearchIssuesResults'
import { SearchIssuesSidebar } from '../search-issues-page/sidebar/SearchIssuesSidebar'
import { SearchSidebar } from '../search-page/sidebar/Sidebar'

export const LandingPageContent = () => {
  const quickLinks: React.ComponentProps<typeof BannerSearch>['quickLinks'] = [
    {
      title: 'Umsóknarkerfi auglýsanda',
      href: '/auglysingar?type=innkollun-throtabu',
      variant: 'blue',
    },
  ]

  return (
    <>
      <HeaderLogin variant="white" />
      <Box marginBottom={12} rowGap={8} display="flex" flexDirection="column">
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
                    {link.title}
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
            <Box marginBottom={3}>
              <Text marginBottom={1} variant="h2">
                Nýjustu tölublöð
              </Text>
              <Text>
                Tölublöð Lögbirtingablaðsins eru á PDF sniði, en til að skoða
                slík skjöl er hægt að nota{' '}
                <Link href="https://get.adobe.com/reader/">
                  <Text as="span" color="blue600">
                    Acrobat Reader
                  </Text>
                </Link>
                .
              </Text>
            </Box>
            <GridRow>
              <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
                <Box>
                  <Box padding={3} background="blue200" borderRadius="md">
                    <SearchIssuesSidebar />
                  </Box>
                </Box>
              </GridColumn>
              <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
                <SearchIssuesResults />
              </GridColumn>
            </GridRow>
          </GridContainer>
        </Box>
      </Box>
      <Footer />
    </>
  )
}
