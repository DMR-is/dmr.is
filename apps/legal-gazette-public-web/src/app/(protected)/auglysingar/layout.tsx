import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { NavigateBack } from '../../../components/client-components/navigate-back/NavigateBack'

export default async function Layout({
  children,
  sidebar,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
}) {
  return (
    <GridContainer>
      <GridRow marginBottom={[4, 5, 6]} marginTop={[4, 5, 6]}>
        <GridColumn span={['12/12', '3/12']}>
          <Stack space={[1, 2]}>
            <NavigateBack />
            <Box paddingY={[2, 3, 4]} borderRadius="large" background="blue100">
              {sidebar}
            </Box>
          </Stack>
        </GridColumn>
        <GridColumn span={['12/12', '9/12']}>
          <Box paddingY={[2, 3, 4]}>{children}</Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
