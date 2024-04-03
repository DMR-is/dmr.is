import {
  Box,
  Breadcrumbs,
  Divider,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { FormStepperV2 } from '../form-stepper/FormStepperV2'
import * as styles from './FormShell.css'

type FormShellType = {
  header: {
    title: string
    description: string
    breadcrumbs?: React.ComponentProps<typeof Breadcrumbs>['items']
  }
  children?: React.ReactNode
  actions?: React.ReactNode
  steps: Array<React.ReactElement>
}

export const FormShell = ({
  header,
  steps,
  actions,
  children,
}: FormShellType) => {
  return (
    <Box className={styles.root}>
      <Box
        paddingTop={[0, 4]}
        paddingBottom={[0, 5]}
        width="full"
        height="full"
      >
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '9/12', '9/12']}
              className={styles.shellContainer}
            >
              <Box
                paddingTop={[3, 6, 8]}
                height="full"
                borderRadius="large"
                background="white"
              >
                <Box
                  marginBottom={[2, 3, 4]}
                  paddingLeft={[0, 0, 6, 8, 12]}
                  paddingRight={[0, 0, 6, 8, 12]}
                >
                  <Breadcrumbs items={header.breadcrumbs ?? []} />
                  <Text
                    marginTop={header.breadcrumbs?.length ? 1 : 0}
                    marginBottom={1}
                    variant={'h1'}
                  >
                    {header.title}
                  </Text>
                  <Text>{header.description}</Text>
                </Box>
                <Box
                  marginBottom={[2, 3, 4]}
                  paddingLeft={[0, 0, 6, 8, 12]}
                  paddingRight={[0, 0, 6, 8, 12]}
                >
                  {children}
                </Box>
              </Box>
            </GridColumn>
            <GridColumn
              span={['12/12', '12/12', '3/12', '3/12']}
              className={styles.sidebarContainer}
            >
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="spaceBetween"
                height="full"
                paddingTop={[0, 0, 8]}
                paddingLeft={[0, 0, 0, 4]}
                className={styles.sidebarInner}
              >
                <Stack space={2}>
                  {actions}
                  <Divider weight="purple200" />
                  <FormStepperV2 sections={steps} />
                </Stack>
              </Box>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </Box>
  )
}
