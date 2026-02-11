import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Text } from '@dmr.is/ui/components/island-is/Text'

export default function NotFound() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Box borderRadius="large" padding={[4, 6]} background="white">
            <Text marginBottom={1} variant="h2">
              Auglýsing fannst ekki
            </Text>
            <Text marginBottom={2}>
              Athugaðu hvort auðkenni slóðarinnar sé rétt
            </Text>
            <LinkV2 href="/auglysingar">
              <Inline space={1} alignY="center">
                <Icon icon="arrowBack" size="small" color="blue400" />
                <Text variant="eyebrow" color="blue400">
                  Til baka á forsíðu
                </Text>
              </Inline>
            </LinkV2>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
