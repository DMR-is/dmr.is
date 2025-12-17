import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

export default function Page() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '12/12', '12/12', '8/12']}
          offset={['0', '0', '0', '1/12']}
        >
          <Stack space={6}>
            <Stack space={2}>
              <Text variant="h2" as="h1">
                Áskriftarskilmálar netúgáfu Lögbirtingablaðs
              </Text>
              <Text variant="intro">
                Skilmálar fyrir áskrift að netúgáfu Lögbirtingablaðs eru
                eftirfarandi:
              </Text>

              <Text>
                Ekki er leyfilegt að afrita efni Lögbirtingablaðs til dreifingar
                eða til að safna saman upplýsingum um einstaka aðila,
                einstaklinga eða lögaðila.
              </Text>
            </Stack>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
