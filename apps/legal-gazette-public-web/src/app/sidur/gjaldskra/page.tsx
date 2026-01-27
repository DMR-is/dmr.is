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
            Gjaldskrá fyrir Lögbirtingablað
          </Text>

          <Box>
            <Text as="div">
              <table align="left">
                <tbody>
                  <tr>
                    <td colSpan={2}>
                      <p>
                        Samkvæmt 3. mgr. 6. gr. laga um Stjórnartíðindi og
                        Lögbirtingablað, nr. 15/2005, eru gjöld fyrir
                        auglýsingar sem birtast í Lögbirtingablaði ákveðin í
                        gjaldskrá sem birt er í Stjórnartíðindum.
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
                          1. Verð fyrir netáskrift er kr. 4.500 fyrir árið.{' '}
                          <br />
                          2. Fyrir Lögbirtingablað í prentuðu formi skal
                          greiddur kostnaður við prentun og sendingu, hvort
                          heldur sem er við sölu eða í áskrift.
                        </p>
                      </blockquote>
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
