import dynamic from 'next/dynamic'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

const TextInput = dynamic(() =>
  import('@dmr.is/ui/components/Inputs/TextInput').then((mod) => mod),
)

type FormShellProps = {
  children?: React.ReactNode
}

export const FormShell = ({ children }: FormShellProps) => {
  return (
    <Box padding={6} background="purple100">
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
            {children}
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
            <Stack space={2}>
              <TextInput
                name="assigned-employee"
                defaultValue="Ármann Árni"
                label="Starfsmaður"
              />
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
