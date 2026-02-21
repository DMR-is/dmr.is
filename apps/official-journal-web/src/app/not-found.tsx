import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'

export default function NotFound() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={'12/12'} paddingBottom={10} paddingTop={8}>
          <Box
            display="flex"
            flexDirection="column"
            width="full"
            alignItems="center"
          >
            <Text
              variant="eyebrow"
              as="div"
              paddingBottom={2}
              color="purple400"
            >
              404
            </Text>
            <Text variant="h1" as="h1" paddingBottom={3}>
              Síða fannst ekki
            </Text>
            <Text variant="intro" as="div">
              Ekkert fannst á þessari slóð. Mögulega hefur síðan verið
              fjarlægð eða færð til.
            </Text>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
