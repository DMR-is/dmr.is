'use client'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  LinkV2,
  Text,
} from '@dmr.is/ui/components/island-is'

import { PageRoutes } from '../../lib/constants'
import { LegalGazetteForm } from '../../lib/forms/types'
import { ApplicationFooter } from './footer/ApplicationFooter'
import * as styles from './application.css'
import { ApplicationSidebar } from './ApplicationSidebar'

type Props = {
  children: React.ReactNode
  title: string
  form: LegalGazetteForm
}

export const ApplicationShell = ({ children, title, form }: Props) => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '12/12', '9/12']}>
          <Box
            className={styles.applicationShellStyles}
            paddingTop={[7, 9]}
            paddingBottom={[4, 6]}
            paddingX={[9, 12]}
            background="white"
          >
            <Inline alignY="center" justifyContent="spaceBetween" space={2}>
              <Text variant="h2">{title}</Text>
              <LinkV2 href={PageRoutes.APPLICATIONS}>
                <Button preTextIcon="arrowBack" variant="text" size="small">
                  Til baka á forsíðu
                </Button>
              </LinkV2>
            </Inline>
            {children}
          </Box>
          <ApplicationFooter />
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '3/12']}>
          <ApplicationSidebar form={form} />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
