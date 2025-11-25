'use client'

import { signIn } from 'next-auth/react'

import { identityServerId } from '@dmr.is/auth/identityProvider'
import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { Bullet, BulletList } from '@island.is/island-ui/core'

export default function Page() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '12/12', '12/12', '8/12']}
          offset={['0', '0', '0', '1/12']}
        >
          <Stack space={2}>
            <Text variant="h2" as="h1" marginBottom={2}>
              Auglýsingaflokkar
            </Text>

            <Text variant="intro">
              Auglýsingar eru flokkaðar eftir efni (tegund auglýsingar) og er
              alltaf hægt að komast í auglýsingaflokka í dálki í síunni. Þegar
              farið er í tiltekinn flokk birtist listi með auglýsingum, sú
              nýjasta efst.
            </Text>
            <Text>
              Auglýsingaflokkunin er lýsandi, en þó er rétt að benda á þrennt:
            </Text>

            <BulletList>
              <Bullet>
                Í fyrsta lagi á flokkinn “Allar auglýsingar” en í honum má finna
                auglýsingar úr öllum flokkum.
              </Bullet>
              <Bullet>
                Í öðru lagi á flokkinn “Ýmsar auglýsingar frá ráðuneytum” en í
                honum má finna auglýsingar frá ráðuneytum sem ekki falla að
                hinum flokkunum.
              </Bullet>
              <Bullet>
                Í þriðja lagi á flokkinn “Ýmsar auglýsingar og tilkynningar” en
                í honum má finna auglýsingar sem ekki rúmast innan annarra
                flokka frá öðrum auglýsendum en ráðuneytum.
              </Bullet>
            </BulletList>

            <Text>
              Þegar auglýsandi efnis sendir auglýsingu þarf hann að velja tegund
              auglýsingar og samkvæmt henni raðast auglýsingar saman á
              áskriftavef eins og að neðan greinir:
            </Text>
          </Stack>
        </GridColumn>
      </GridRow>
      <GridRow marginTop={3}>
        <GridColumn
          span={['12/12', '12/12', '12/12', '5/12']}
          offset={['0', '0', '0', '1/12']}
          paddingBottom={2}
        >
          <Stack space={2}>
            <Stack space={0}>
              <Text variant="medium">
                <b>Allar auglýsingar</b>
              </Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Áskoranir</b>
              </Text>
              <Text variant="medium">Áskorun; Greiðsluáskorun</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Dómsbirtingar</b>
              </Text>
              <Text variant="medium">Dómsbirting</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Embætti, sýslanir, leyfi o.fl.</b>
              </Text>
              <Text variant="medium">Embætti, sýslanir, leyfi o.fl.</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Fasteigna-, fyrirtækja- og skipasala</b>
              </Text>
              <Text variant="medium">Fasteigna-, fyrirtækja- og skipasala</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Firmaskrá</b>
              </Text>
              <Text variant="medium">Firmaskrá</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Fjármálastarfsemi</b>
              </Text>
              <Text variant="medium">Fjármálastarfsemi</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Fyrirköll og ákærur</b>
              </Text>
              <Text variant="medium">Greiðsluaðlögun; Fyrirkall</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Greiðsluaðlögun</b>
              </Text>
              <Text variant="medium">Greiðsluaðlögun</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Happdrætti</b>
              </Text>
              <Text variant="medium">Happdrætti</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Hlutafélög</b>
              </Text>
              <Text variant="medium">
                Hlutafélög; Aukatilkynning hlutafélaga; Skráning hlutafélags
              </Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Húsbréf</b>
              </Text>
              <Text variant="medium">Húsbréf</Text>
            </Stack>
            <Stack space={0}>
              <Text variant="medium">
                <b>Innkallanir</b>
              </Text>
              <Text variant="medium">
                Innköllun; Innköllun dánarbú; Innköllun þrotabú
              </Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Kaupmálar</b>
              </Text>
              <Text variant="medium">Kaupmáli</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Laus störf, embætti o.fl.</b>
              </Text>
              <Text variant="medium">Laus störf, stöður, embætti o.fl.</Text>
            </Stack>
          </Stack>
        </GridColumn>

        <GridColumn span={['12/12', '12/12', '12/12', '5/12']}>
          <Stack space={2}>
            <Stack space={0}>
              <Text variant="medium">
                <b>Mat á umhverfisáhrifum</b>
              </Text>
              <Text variant="medium">Mat á umhverfisáhrifum</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Nauðasamningar</b>
              </Text>
              <Text variant="medium">Nauðasamningar</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Nauðungarsölur</b>
              </Text>
              <Text variant="medium">Nauðungarsala; Framhald uppboðs</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Skipta- og veðhafafundir</b>
              </Text>
              <Text variant="medium">Skiptafundur; Veðhafafundur</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Skiptalok</b>
              </Text>
              <Text variant="medium">Skiptalok</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Skipulagsauglýsingar</b>
              </Text>
              <Text variant="medium">Skipulagsauglýsing</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Starfsleyfi</b>
              </Text>
              <Text variant="medium">Starfsleyfi</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Stefnur</b>
              </Text>
              <Text variant="medium">Stefna</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Svipting fjárræðis</b>
              </Text>
              <Text variant="medium">Svipting fjárræðis</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Umferðarauglýsingar</b>
              </Text>
              <Text variant="medium">Umferðarauglýsingar</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Vátryggingastarfsemi</b>
              </Text>
              <Text variant="medium">Vátryggingastarfsemi</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Ýmsar auglýsingar frá ráðuneytum</b>
              </Text>
              <Text variant="medium">Ýmsar auglýsingar frá ráðuneytum</Text>
            </Stack>

            <Stack space={0}>
              <Text variant="medium">
                <b>Ýmsar auglýsingar og tilkynningar</b>
              </Text>
              <Text variant="medium">Ýmsar auglýsingar og tilkynningar</Text>
            </Stack>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
