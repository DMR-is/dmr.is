import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@dmr.is/ui/components/island-is'

export default function Page() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '12/12', '12/12', '7/12']}
          offset={['0', '0', '0', '1/12']}
        >
          <Text variant="h2" as="h1" marginBottom={4}>
            Gjaldskrá
          </Text>
          <Box
            border="standard"
            borderRadius="standard"
            padding={[1, 2, 4]}
            marginBottom={4}
          >
            <Text as="div" variant="small">
              <table align="center">
                <thead></thead>
                <tbody>
                  <tr>
                    <td align="left">Nr. 82/2019</td>
                    <td align="right">15. janúar 2019</td>
                  </tr>
                  <tr>
                    <td align="center" colSpan={2}>
                      <h2>AUGLÝSING</h2>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" colSpan={2}>
                      um breyting á gjaldskrá fyrir Lögbirtingablað, nr.
                      1300/2017.
                    </td>
                  </tr>
                  <br />
                  <tr>
                    <td align="center" colSpan={2}>
                      1. gr.
                    </td>
                  </tr>
                  <tr>
                    <td align="center" colSpan={2}>
                      Í stað fjárhæðarinnar „2.300“ í 3. tölul. 2. gr.
                      gjaldskrárinnar kemur: 3.000.
                    </td>
                  </tr>

                  <tr>
                    <td align="center" colSpan={2}>
                      2. gr.
                    </td>
                  </tr>
                  <tr>
                    <td align="center" colSpan={2}>
                      Auglýsing þessi um breyting á gjaldskránni er sett skv. 2.
                      mgr. 7. gr. laga um Stjórnartíðindi og Lögbirtingablað,
                      nr. 15 10. mars 2005 með síðari breytingum og tekur gildi
                      þegar í stað.
                    </td>
                  </tr>
                  <br />
                  <tr>
                    <td align="center" colSpan={2}>
                      <i>Dómsmálaráðuneytinu, 15. janúar 2019.</i>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" colSpan={2}>
                      <b>Sigríður Á. Andersen.</b>
                    </td>
                  </tr>

                  <tr>
                    <td align="right" colSpan={2}>
                      <i>Haukur Guðmundsson.</i>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Text>
          </Box>
          <Box border="standard" borderRadius="standard" padding={[1, 2, 4]}>
            <Text as="div" variant="small">
              <table align="center">
                <thead></thead>
                <tbody>
                  <tr>
                    <td align="left">Nr. 1300/2017</td>
                    <td align="right" width="50%">
                      27. desember 2017
                    </td>
                  </tr>
                  <tr>
                    <td align="center" colSpan={2}>
                      <h2>GJALDSKRÁ</h2>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} align="center">
                      fyrir Lögbirtingablað.
                    </td>
                  </tr>
                  <br />
                  <tr>
                    <td align="center" colSpan={2}>
                      <p>1. gr.</p>
                      <p>
                        Samkvæmt 3. mgr. 6. gr. laga um Stjórnartíðindi og
                        Lögbirtingablað, nr. 15 10. mars 2005, eru gjöld fyrir
                        auglýsingar sem birtast í Lögbirtingablaði hér með
                        ákveðin þannig:
                      </p>
                      <br />
                      <p style={{ textAlign: 'left', marginBottom: '8px' }}>
                        1. Fyrir auglýsingar í eftirtöldum flokkum sem sendar
                        eru inn í gegnum almennt auglýs­inga­form í
                        auglýsingakerfi Lögbirtingablaðsins greiðast 4 kr. fyrir
                        stafabil, hvert slag:
                      </p>
                      <blockquote dir="ltr" style={{ margin: '0 0 0 40px' }}>
                        <p style={{ textAlign: 'left' }}>
                          Auglýsing/tilkynning varðandi fjármálastarfsemi
                          <br />
                          Auglýsing/tilkynning frá ráðuneyti
                          <br />
                          Áskorun
                          <br />
                          Dómsbirting
                          <br />
                          Embætti, sýslanir, leyfi o.fl.
                          <br />
                          Fasteigna-, fyrirtækja- og skipasala
                          <br />
                          Félagsslit
                          <br />
                          Framhald uppboðs
                          <br />
                          Fyrirkall
                          <br />
                          Greiðsluáskorun
                          <br />
                          Happdrætti
                          <br />
                          Húsbréf
                          <br />
                          Innkallanir (aðrar en þrotabúa og dánarbúa)
                          <br />
                          Kaupmáli
                          <br />
                          Laus störf, stöður, embætti o.fl.
                          <br />
                          Mat á umhverfisáhrifum
                          <br />
                          Nauðasamningar
                          <br />
                          Skipulagsauglýsing
                          <br />
                          Starfsleyfi
                          <br />
                          Stefna
                          <br />
                          Svipting fjárræðis
                          <br />
                          Umferðarauglýsing
                          <br />
                          Vátryggingafélagaskrá/vátryggingamiðlaraskrá
                          <br />
                          Veðhafafundur
                          <br />
                          Ýmsar auglýsingar og tilkynningar
                          <br />
                        </p>
                      </blockquote>
                      <br />
                      <p style={{ textAlign: 'left', marginBottom: '4px' }}>
                        2. Fyrir eftirtaldar auglýsingar greiðist sem hér segir:
                      </p>

                      <table
                        align="left"
                        width={'100%'}
                        style={{ marginLeft: '40px' }}
                      >
                        <thead></thead>
                        <tbody>
                          <tr>
                            <td width="44%">
                              <p>Aukatilkynning hlutafélagaskrár</p>
                            </td>
                            <td width="56%">
                              <p>1.500 kr. fyrir hverja tilkynningu.</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="44%">
                              <p>Firmaskráning</p>
                            </td>

                            <td width="56%">
                              <p>1.500 kr. fyrir auglýsingu.</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="44%">
                              <p>Hlutafélagaskráning</p>
                            </td>
                            <td width="56%">
                              <p>1.500 kr. fyrir auglýsingu.</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="44%">
                              <p>Innköllun dánarbús</p>
                            </td>
                            <td width="56%">
                              <p>1.500 kr. fyrir hvert bú.</p>
                            </td>
                          </tr>

                          <tr>
                            <td width="44%">
                              <p>Innköllun þrotabús</p>
                            </td>
                            <td width="56%">
                              <p>1.500 kr. fyrir hvert bú.</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="44%">
                              <p>Nauðungarsala</p>
                            </td>
                            <td width="56%">
                              <p>1.500 kr. fyrir hverja eign.</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="44%">
                              <p>Skiptafundur dánarbús</p>
                            </td>
                            <td width="56%">
                              <p>1.500 kr. fyrir auglýsingu.</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="44%">
                              <p>Skiptafundur þrotabús</p>
                            </td>
                            <td width="56%">
                              <p>1.500 kr. fyrir auglýsingu.</p>
                            </td>
                          </tr>

                          <tr>
                            <td width="44%">
                              <p>Skiptalok dánarbús</p>
                            </td>
                            <td width="56%">
                              <p>1.500 kr. fyrir auglýsingu.</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="44%">
                              <p>Skiptalok þrotabús</p>
                            </td>
                            <td width="56%">
                              <p>1.500 kr. fyrir auglýsingu.</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={2}>
                      <p style={{ margin: '8px 0 4px' }}>3. Annað:</p>

                      <p style={{ marginLeft: '40px' }}>
                        Einungis er greitt fyrir 1. birtingu auglýsinga sem
                        skylt er skv. lögum að birta oftar. Heimilt er að
                        innheimta allt að tvöfalt verð auglýsingar vegna vinnu
                        við innslátt eða uppsetningu. Heimilt er að innheimta
                        álag þótt auglýsing hafi verið afturkölluð. Gjald vegna
                        fylgiskjals sem birtist með auglýsingu er kr. 5.000.
                      </p>
                      <br />
                      <p style={{ textAlign: 'center', marginBottom: '4px' }}>
                        2. gr.
                      </p>
                      <p style={{ marginBottom: '8px' }}>
                        Samkvæmt 2. mgr. 7. gr. laga um Stjórnartíðindi og
                        Lögbirtingablað, nr. 15/2005, er gjald fyrir áskrift að
                        Lögbirtingablaði sem hér segir:
                      </p>
                      <blockquote
                        dir="ltr"
                        style={{
                          marginRight: '0px',
                          marginLeft: '40px',
                          textAlign: 'left',
                        }}
                      >
                        <p>
                          1. Áskrift að prentaðri útgáfu Lögbirtingablaðs er kr.
                          82.000 fyrir árið. <br />
                          2. Verð einstakra blaða er kr. 802. <br />
                          3. Verð fyrir netáskrift er kr. 2.300 fyrir árið.
                        </p>
                      </blockquote>
                      <br />
                      <p style={{ textAlign: 'center', marginBottom: '4px' }}>
                        3. gr.
                      </p>
                      <p style={{ textAlign: 'center' }}>
                        Gjaldskrá þessi, sem kemur í stað gjaldskrár nr.
                        1028/2015, öðlast gildi 15. janúar 2018.
                      </p>
                    </td>
                  </tr>
                  <br />
                  <tr>
                    <td align="center" colSpan={2}>
                      <i>Dómsmálaráðuneytinu, 27. desember 2017.</i>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" colSpan={2}>
                      <b>Sigríður Á. Andersen.</b>
                    </td>
                  </tr>

                  <tr>
                    <td align="right" colSpan={2}>
                      <i>HBryndís Helgadóttir.</i>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Text>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
