'use client'

import {
  Accordion,
  AccordionItem,
  Box,
  Bullet,
  BulletList,
  GridColumn,
  GridContainer,
  GridRow,
  LinkV2,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { VideoIframe } from '@island.is/island-ui/core'

export default function Page() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '12/12', '12/12', '11/12', '8/12']}
          offset={['0', '0', '0', '0', '1/12']}
        >
          <Stack space={5}>
            <Text variant="h2" as="h1">
              Leiðbeiningar fyrir Lögbirtingablaðið
            </Text>

            <Accordion singleExpand={false}>
              <AccordionItem
                id={'i1'}
                labelVariant="h4"
                label="Hvað er auglýsingakerfi Lögbirtingablaðsins"
              >
                <Box>
                  <Text>
                    Hér má sjá rafrænt ferli fyrir alla sem senda inn auglýsingu
                    í lögbirtingablaðið, einstaklinga og fyrirtæki.
                    <br />
                    Kerfið gerir ferlið skilvirkara og einfaldara í notkun,
                    býður notendum upp á að fylgjast með stöðu auglýsingar meðan
                    auglýsingin vinnst í ritstjórn.
                    <br />
                    Einnig býður kerfið notendum að halda utan um innkallanir
                    svo sem þrotabús og dánarsbús sem bera margar auglýsingar á
                    skilvirkan hátt.
                  </Text>
                </Box>
              </AccordionItem>

              <AccordionItem
                id={'i2'}
                labelVariant="h4"
                label="Aðgangur að auglýsingakerfi Lögbirtingablaðsins"
                startExpanded
              >
                <Box>
                  <Stack space={2}>
                    <Text>
                      Allir með rafræn skilríki geta sent inn auglýsingu inn í
                      Lögbirtingablaðið.
                    </Text>
                    <Stack space={1}>
                      <Text variant="h4">
                        Umboð - hvernig skrái ég auglýsingu inn í nafni
                        fyrirtækis
                      </Text>

                      <Text>
                        Notandi getur sent inn auglýsingu inn í
                        Lögbirtingablaðið og/eða haft áskrift að
                        Lögbirtingablaðinu í umboði fyrirtækis, stofnana eða
                        einstaklinga.
                        <br />
                        Til að geta farið inn í umboði annars þarf prókúruhafi
                        viðeigandi kennitölu að gefa viðeigandi einstaklingum
                        umboð í gegnum ísland.is.
                      </Text>
                    </Stack>
                    <Text>
                      Notandi með prókúruréttindi fyrirtækis getur veitt öðrum
                      einstaklingum umboð til að senda inn auglýsingar fyrir
                      viðkomandi fyrirtæki eða félag:
                    </Text>
                    <BulletList type="ol">
                      <Bullet>
                        Farið er á vefslóðina{' '}
                        <LinkV2
                          href="https://island.is/minarsidur/adgangsstyring/umbod"
                          newTab
                          underline="normal"
                          underlineVisibility="hover"
                        >
                          island.is/minarsidur/adgangsstyring/umbod
                        </LinkV2>
                      </Bullet>
                      <Bullet>
                        Valin stofnunin sem úthluta á réttindum vegna
                      </Bullet>
                      <Bullet>Smellt á hnappinn „Skrá nýtt umboð“</Bullet>
                      <Bullet>
                        Skráð kennitala þess aðila sem mun senda inn í umboði
                        fyrirtækis
                      </Bullet>
                      <Bullet>Valin aðgangsstýring: „Lögbirtingablað“</Bullet>
                      <Bullet>
                        Smellt á hnappinn „Velja réttindi“ til að fara í næsta
                        skref
                      </Bullet>
                      <Bullet>
                        Viðeigandi réttindi valin: „Umsókn um auglýsingu í
                        Lögbirtingablaðið“
                      </Bullet>
                      <Bullet>Smellt á hnappinn „Skrá nýtt umboð“</Bullet>
                      <Bullet>Loks er smellt á „Staðfesta“ hnapp</Bullet>
                    </BulletList>
                    <Box>
                      <Text as="span">Hér má lesa meira um </Text>
                      <LinkV2
                        href="https://island.is/innskraning-umbod-og-adgangsstyring-a-island-is"
                        newTab
                        color="blue400"
                        underline="normal"
                      >
                        umboðskerfi ísland.is
                      </LinkV2>
                      <Text as="span">.</Text>
                    </Box>

                    <Stack space={1}>
                      <Text variant="h4">
                        Umboð - hvernig gef ég umboð til að gefa umboð áfram
                      </Text>

                      <Text>
                        Prókúruhafi getur gefið umboð til notenda til að gefa
                        öðrum umboð. Þá fer prókúruhafi í gegnum umboðsferlið
                        hér að ofan og gefur notanda umboð fyrir kerfi
                        Lögbirtingarblaðsins
                      </Text>
                    </Stack>
                    <Box>
                      <Text as="span">
                        Ef þig vantar frekari aðstoð, sendu póst á {''}
                      </Text>
                      <LinkV2
                        href="https://island.is/minarsidur/adgangsstyring/umbod"
                        newTab
                        color="blue400"
                        underline="normal"
                      >
                        island.is/minarsidur/adgangsstyring/umbod
                      </LinkV2>
                    </Box>
                    <BulletList type="ol">
                      <Bullet>
                        Prókúruhafi gefur notanda umboð fyrir kerfi
                        Lögbirtingarblaðsins.
                      </Bullet>
                      <Bullet>Smellt á hnappinn „Skrá nýtt umboð“</Bullet>
                      <Bullet>
                        Skráð kennitala þess aðila sem mun senda inn í umboði
                        fyrirtækis.
                      </Bullet>
                      <Bullet>
                        Valin aðgangsstýring: “Mínar síður Ísland.is“
                      </Bullet>
                      <Bullet>
                        Smellt á hnappinn „Velja réttindi“ til að fara í næsta
                        skref
                      </Bullet>
                      <Bullet>
                        Viðeigandi réttindi valin: „Aðgangsstýring - gefur leyfi
                        til að veita öðrum aðgang að upplýsingum og aðgerðum“
                      </Bullet>
                      <Bullet>Smellt á hnappinn „Skrá nýtt umboð“</Bullet>
                      <Bullet>Loks er smellt á „Staðfesta“ hnapp.</Bullet>
                    </BulletList>

                    <Box>
                      <Text as="span">
                        Ef þig vantar frekari aðstoð, sendu póst á {''}
                      </Text>
                      <LinkV2
                        href="mailto:logbirtingabladid@syslumenn.is"
                        newTab
                        color="blue400"
                        underline="normal"
                      >
                        logbirtingabladid@syslumenn.is
                      </LinkV2>
                    </Box>
                    <Stack space={1}>
                      <Text fontWeight="medium">
                        Greiðslur fyrir auglýsingar
                      </Text>
                      <Text>
                        Allar greiðslur fara í hefðbundið greiðsluflæði þar sem
                        við útgáfu á máli stofnast krafa í heimabanka viðkomandi
                        auglýsanda.
                      </Text>
                    </Stack>
                    <Stack space={2}>
                      <Text fontWeight="medium">
                        Myndbönd með leiðbeiningum fyrir umboð
                      </Text>
                      <VideoIframe
                        src="https://www.youtube.com/embed/sDHeQdnVpAU?si=Qsz5XhsUm2vwc5l1"
                        title="default"
                      />
                      <VideoIframe
                        src="https://www.youtube.com/embed/NuFQqKxyBLk?si=M-gUxYpi2XBc8vlR"
                        title="default"
                      />
                    </Stack>
                  </Stack>
                </Box>
              </AccordionItem>

              <AccordionItem
                id={'i3'}
                labelVariant="h4"
                label="Aðgangur að vef Lögbirtingarblaðsins"
                startExpanded
              >
                <Box>
                  <Stack space={2}>
                    <Text>
                      Allir geta séð ytri vef Lögbirtingarblaðsins án gjaldtöku.
                      Hægt er að nálgast PDF útgáfur að birtum auglýsingum. Til
                      að nálgast allar auglýsingar sem eru birtar í
                      Lögbirtingarblaðinu þarf að vera áskrifendur.
                    </Text>
                    <Stack space={1}>
                      <Text fontWeight="medium">
                        Áskrifendur Lögbirtingablaðsins
                      </Text>
                      <Box>
                        <Text as="span">
                          Hægt er að gerast áskrifandi á Lögbirtingablaðis gegn
                          gjaldi,{' '}
                        </Text>
                        <LinkV2
                          href="http://logbirtingablad.is/sidur/gjaldskra"
                          newTab
                          color="blue400"
                          underline="normal"
                        >
                          sjá gjaldskrá
                        </LinkV2>
                        <Text as="span">
                          . Hægt er að fá aðgang í nafni fyrirtækis með því að
                          skrá sig inn í umboði viðeigandi fyrirtækist (sjá
                          umboðskafla hér að ofan).
                        </Text>
                      </Box>
                    </Stack>
                    <Text>
                      Notendur fá val um að gerast áskrifandi við innskráningu
                      ef ekki er áskrift til staðar. Ef notandi veljur að gerast
                      áskrifandi fer krafa í heimabanka viðkomandi og hægt er að
                      skoða vef Lögbirtingablaðsins strax.
                    </Text>
                    <Text>
                      Ef notandi skráir sig inn í umboði fyrirtækis sem er ekki
                      með áskrift, gefur kerfið notendanum kost á að gera
                      fyrirtækið áskrifanda og myndast krafa á kennitölu
                      fyrirtækisins.
                    </Text>
                  </Stack>
                </Box>
              </AccordionItem>
            </Accordion>

            <Stack space={3}>
              <Text variant="h3">
                Myndbönd með leiðbeiningum fyrir aulýsingakerfi
              </Text>
              <VideoIframe
                src="https://www.youtube.com/embed/Dxd9emfI7Tw?si=EnBnrk7xrKuCwbl7"
                title="default"
              />
              <VideoIframe
                src="https://www.youtube.com/embed/VJu5c0zc0xE?si=F3xiyX32QSda_40d"
                title="default"
              />
            </Stack>

            <Stack space={3}>
              <Text variant="h3">Algengar spurningar</Text>

              <Accordion singleExpand={false}>
                <AccordionItem
                  id="l1"
                  label="Hvernig fæ ég aðgang að til að lesa auglýsingar í lögbirtingarblaðinu?"
                  labelVariant="h5"
                >
                  <Box>
                    <Stack space={1}>
                      <Text>
                        Hægt er að sækja pdf útgáfu af eldri málum á ytri vef
                        lögbirtingarblaðsins. Einnig er hægt að sækja um áskrift
                        að lögbirtingarblaðinu og geta þá lesið auglýsingar
                        strax við útgáfu. Einstaklingur skráir sig inn með
                        rafrænum skilríkjum, kerfið leiðir notanda í nýskráningu
                        til að gerast áskrifandi ef áskrift er ekki til staðar.
                      </Text>

                      <Text fontWeight="medium">
                        Greiðsla fyrir áskrift er send sem krafa í heimabanka
                        viðkomandi.
                      </Text>
                      <Text>
                        Umboð: Einstaklingar sem skrá sig inn í umboði annars
                        kennitölu en sinni eigin fær upp þau réttindi sem
                        viðkomandi kennitala er með. Ef fyrirtæki er ekki með
                        áskrift býðst einstaklingi sem er að skrá sig inn í
                        umboði að kaupa áskrift fyrir hönd fyrirtækis.
                      </Text>
                    </Stack>
                  </Box>
                </AccordionItem>

                <AccordionItem
                  id="l2"
                  label="Hvernig skjöl get ég sett inn í ritilinn?"
                  labelVariant="h5"
                >
                  <Box>
                    <Text>
                      Microsoft Word skjöl og skjöl sem eru vistuð sem
                      .doc/docx.
                    </Text>
                  </Box>
                </AccordionItem>

                <AccordionItem
                  id="l3"
                  label="Hvað ef ég geri vitleysu í umsókn?"
                  labelVariant="h5"
                >
                  <Box>
                    <Text>
                      Allar auglýsingar sem hafa ekki verið gefnar út er hægt að
                      afturkalla.
                    </Text>
                  </Box>
                </AccordionItem>

                <AccordionItem
                  id="l4"
                  label="Get ég hætt við birtingu?"
                  labelVariant="h5"
                >
                  <Box>
                    <Text>
                      Hægt er að afturkalla auglýsingu sem hefur verið send inn
                      til ritstjórnar ef hún er ekki útgefin. Með því að
                      afturkalla auglýsingu er henni eitt og ekki hægt að
                      breyta.
                    </Text>
                  </Box>
                </AccordionItem>

                <AccordionItem
                  id="l5"
                  label="Eru auglýsingar gefnar út á völdum útgáfudegi?"
                  labelVariant="h5"
                >
                  <Box>
                    <Text>
                      Auglýsingar sem eru sendar inn fyrir hádegi geta verið
                      gefið út samdægurs eða á þeim degi sem óskað er eftir.
                      Auglýsingar sem eru sendar inn eftir hádegi fara í útgáfu
                      næsta virka dag eða á þeim degi sem óskað er eftir.
                    </Text>
                  </Box>
                </AccordionItem>

                <AccordionItem
                  id="l6"
                  label="Hvernig hef ég samskipti við ritstjórn?"
                  labelVariant="h5"
                >
                  <Box>
                    <Text as="span">
                      Samskipti við ritstjórn fara fram í gegnum tölvupóst, {''}
                    </Text>
                    <LinkV2
                      href="mailto:logbirtingabladid@syslumenn.is"
                      newTab
                      color="blue400"
                      underline="normal"
                    >
                      logbirtingabladid@syslumenn.is
                    </LinkV2>
                  </Box>
                </AccordionItem>

                <AccordionItem
                  id="l7"
                  label="Get ég fylgst með þróun auglýsinga inn í ritstjórn?"
                  labelVariant="h5"
                >
                  <Box>
                    <Text marginBottom={2}>
                      Undir „Mínar auglýsingar“ er yfirlit yfir auglýsingar og
                      mál sem þú hefur sent inn eða ert með í vinnslu. Hægt er
                      að sjá stöðu auglýsinga
                    </Text>
                    <BulletList>
                      <Bullet>
                        Í vinnslu hjá notenda - auglýsing sem hefur ekki verið
                        send inn til ritstjórnar og er því opin fyrir breytingar
                      </Bullet>
                      <Bullet>
                        Innsent - auglýsing sem hefur verið send inn til
                        ritstjórnar og ekki er hægt að breyta. Bíður þess að
                        ritstjórn tekur auglýsingu fyrir.
                      </Bullet>
                      <Bullet>
                        Í vinnslu hjá ritstjórn - auglýsing sem hefur verið send
                        inn til ritstjórnar og ekki er hægt að breyta. Ritstjórn
                        hefur tekið auglýsingu fyrir og er hún í yfirlestri.
                      </Bullet>
                      <Bullet>
                        Birting A/B/C útgefin - Auglýsing útgefin - Birting
                        A/B/C
                      </Bullet>
                    </BulletList>
                  </Box>
                </AccordionItem>

                <AccordionItem
                  id="l1"
                  label="Fæ ég tilkynningu þegar málið hefur verið gefið út?"
                  labelVariant="h5"
                >
                  <Box>
                    <Text>
                      Innsendandi fær tölvupóst þegar mál eru gefin út. Einnig
                      er hægt að fylgjast með stöðu mála undir mínar
                      auglýsingar.
                    </Text>
                  </Box>
                </AccordionItem>
              </Accordion>
            </Stack>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
