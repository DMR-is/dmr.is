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

import { BannerSearch } from '../../client-components/front-page/banner-search/BannerSearch'

export const LandingPage = async () => {
  const quickLinks: React.ComponentProps<typeof BannerSearch>['quickLinks'] = [
    {
      title: 'Umsóknarkerfi auglýsanda',
      href: '/auglysingar?type=innkollun-throtabu',
      variant: 'blue',
    },
  ]

  const breadcrumbItems: React.ComponentProps<typeof Hero>['breadcrumbs'] = {
    items: [
      {
        title: 'Dómsmálaráðuneytið',
      },
    ],
  }

  return (
    <>
      <HeaderLogin variant="white" />
      <Box paddingY={4} rowGap={8} display="flex" flexDirection="column">
        <Hero
          title="Lögbirtingablaðið"
          contentSpan={['12/12', '12/12', '12/12', '6/12']}
          imageSpan={'4/12'}
          withOffset={true}
          image={{ src: '/images/hero-page-image.svg' }}
          breadcrumbs={breadcrumbItems}
          description="Dómsmálaráðuneytið gefur út Lögbirtingablað. Það kom fyrst út í prentuðu formi í ársbyrjun 1908, skv. lögum nr. 32/1907 og var þá gefið út einu sinni í viku 2 eða 4 bls. eftir þörfum í stærðinni A4. Síðan hefur Lögbirtingablað verið gefið út óslitið til dagsins í dag."
          button={quickLinks?.map((link, i) => (
            <Button key={i} size="small" icon="open" iconType="outline">
              {link.title}
            </Button>
          ))}
          alignHeader={'spaceBetween'}
        >
          <GridContainer>
            <GridRow>
              <GridColumn offset={['0', '0', '0', '1/12']}>
                <Text variant="default">
                  Samkvæmt lögum nr. 15/2005 skal birta í Lögbirtingablaði
                  dómsmálaauglýsingar, svo sem stefnur til dóms, úrskurði um
                  töku búa til opinberra skipta og áskoranir um kröfulýsingar,
                  auglýsingar um skiptafundi og skiptalok þrotabúa,
                  nauðungarsölur, þar á meðal á fasteignum búa sem eru til
                  opinberra skipta, auglýsingar um vogrek, óskilafé og fundið
                  fé, auglýsingar um kaupmála hjóna, lögræðissviptingu og
                  brottfall hennar, lögboðnar auglýsingar um félög og firmu,
                  sérleyfi er stjórnvöld veita, opinber verðlagsákvæði og annað
                  það er stjórnvöldum þykir rétt að birta almenningi.
                </Text>
              </GridColumn>
            </GridRow>
          </GridContainer>
        </Hero>
        {/* <GridContainer>
          <GridRow>
            <GridColumn offset={['0', '0', '0', '1/12']}>
              <Stack space={1}>
                <Inline space={4}>
                  {quickLinks?.map((link, i) => (
                    <Button key={i} size="small" icon="open">
                      {link.title}
                    </Button>
                  ))}
                </Inline>
              </Stack>
            </GridColumn>
          </GridRow>
        </GridContainer> */}
        <Box background="blue100" paddingY={8}>
          <GridContainer>
            <GridRow>
              <GridColumn span={['1/1', '1/1', '1/1', '12/12']}>
                <Stack space={[2, 3, 4]}>
                  <Text variant="h2">Nýjustu auglýsingar</Text>
                </Stack>
              </GridColumn>
            </GridRow>
          </GridContainer>
        </Box>
      </Box>
    </>
  )
}
