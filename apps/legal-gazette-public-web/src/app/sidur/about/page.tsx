'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { Link } from '@island.is/island-ui/core'

export default function Page() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '12/12', '12/12', '8/12']}
          offset={['0', '0', '0', '1/12']}
        >
          <Stack space={3}>
            <Text variant="h2" as="h1">
              Um Lögbirtingablað
            </Text>
            <Stack space={0}>
              <Text variant="h5">Saga:</Text>
              <Text>
                Dómsmálaráðuneytið gefur út Lögbirtingablað. Það kom fyrst út í
                prentuðu formi í ársbyrjun 1908, skv. lögum nr. 32/1907 og var
                þá gefið út einu sinni í viku 2 eða 4 bls. eftir þörfum í
                stærðinni A4. Síðan hefur Lögbirtingablað verið gefið út í
                prentuðu formi óslitið til dagsins í dag, nú síðast skv. lögum
                nr. 64/1943, þar til lög nr. 15/2005 leystu þau af hólmi.
                Undanfarin ár hefur útgáfan vaxið jafnt og þétt og hefur síðustu
                árin verið yfir 1200 bls. á ári í brotinu Folio. Í ársbyrjun
                2002 var ákveðið að gera blaðið einnig aðgengilegt á netinu og
                er nú hægt að nálgast þar öll tölublöð sem komið hafa út frá 1.
                janúar 2001.
              </Text>
            </Stack>
            <Stack space={0}>
              <Text variant="h5">Hvað skal birta:</Text>
              <Text>
                Samkvæmt lögum nr. 15/2005 skal birta í Lögbirtingablaði
                dómsmálaauglýsingar, svo sem stefnur til dóms, úrskurði um töku
                búa til opinberra skipta og áskoranir um kröfulýsingar,
                auglýsingar um skiptafundi og skiptalok þrotabúa,
                nauðungarsölur, þar á meðal á fasteignum búa sem eru til
                opinberra skipta, auglýsingar um vogrek, óskilafé og fundið fé,
                auglýsingar um kaupmála hjóna, lögræðissviptingu og brottfall
                hennar, lögboðnar auglýsingar um félög og firmu, sérleyfi er
                stjórnvöld veita, opinber verðlagsákvæði og annað það er
                stjórnvöldum þykir rétt að birta almenningi.
              </Text>
            </Stack>
            <Stack space={0}>
              <Text variant="h5">Áskrifendur:</Text>
              <Text>
                Vefur Lögbirtingablaðsins er áskriftarvefur, þar sem auglýsingar
                Lögbirtingablaðsins eru birtar. Áskrifendur geta skoðað og
                vaktað ákveðna flokka auglýsinga og leitað á vefnum.
                Lögbirtingablaðið verður áfram aðgengilegt á netinu, án
                endurgjalds á PDF-sniði. Taka ber fram að réttaráhrif
                auglýsingar sem birtast í PDF útgáfu geta verið liðin. Þeir sem
                þess óska geta keypt Lögbirtingablað í prentuðu formi í áskrift
                eða fengið einstök tölublöð send gegn greiðslu kostnaðar af
                prentun þeirra og sendingu.
              </Text>
            </Stack>
            <Stack space={0}>
              <Text variant="h5">Auglýsendur:</Text>
              <Text>
                Þeir sem auglýsa í Lögbirtingablaði geta nú útbúið og sent inn
                auglýsingarnar rafrænt. Þeir fá uppfærða yfirsýn yfir allar
                auglýsingar sínar hvort heldur í vinnslu, innsendar eða
                útgefnar. Sækja þarf um aðgang til að senda inn auglýsingar.
              </Text>
            </Stack>
            <Stack space={0}>
              <Text variant="h5">Þjónusta:</Text>
              <Text>
                Notendaþjónusta Lögbirtingablaðs svarar fyrirspurnum og
                ábendingum varðandi notkun á netútgáfunni og rafræna innsendingu
                auglýsinga á netfanginu logbirtingabladid@syslumenn.is og í síma
                458 2800. Sama á við um þá sem ætla að panta áskrift að
                Lögbirtingablaði í prentaðri útgáfu.
              </Text>
            </Stack>
            <Stack space={1}>
              <Text variant="h5">Lög og reglugerðir:</Text>

              <Stack space={1}>
                <Link
                  color="blue600"
                  href="http://www.althingi.is/altext/stjt/2005.015.html"
                >
                  Lög nr. 15/2005 um Stjórnartíðindi og Lögbirtingablað
                </Link>
                <Link
                  color="blue600"
                  href="http://www.reglugerd.is/interpro/dkm/WebGuard.nsf/key2/623-2005"
                >
                  Reglugerð um útgáfu Lögbirtingablaðs nr. 623/2005
                </Link>
              </Stack>
            </Stack>
            <Stack space={0}>
              <Text variant="h5">Tenglar:</Text>

              <Stack space={0}>
                <div>
                  <Text as="span">Reglugerðavefurinn: </Text>
                  <Link color="blue600" href="http://reglugerd.is">
                    reglugerd.is
                  </Link>
                </div>
                <div>
                  <Text as="span">Réttarheimildir: </Text>
                  <Link color="blue600" href="http://rettarheimild.is">
                    rettarheimild.is
                  </Link>
                </div>
                <div>
                  <Text as="span">Stjórnartíðindi: </Text>
                  <Link color="blue600" href="http://stjornartidindi.is">
                    stjornartidindi.is
                  </Link>
                </div>
                <div>
                  <Text as="span">Danmörk: </Text>
                  <Link color="blue600" href="http://statstidende.dk">
                    statstidende.dk
                  </Link>
                </div>
                <div>
                  <Text as="span">Finnland: </Text>
                  <Link color="blue600" href="http://virallinenlehti.fi">
                    virallinenlehti.fi
                  </Link>
                </div>
                <div>
                  <Text as="span">Noregur: </Text>
                  <Link color="blue600" href="http://norsk.lysingsblad.no">
                    norsk.lysingsblad.no
                  </Link>
                </div>
              </Stack>
            </Stack>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
