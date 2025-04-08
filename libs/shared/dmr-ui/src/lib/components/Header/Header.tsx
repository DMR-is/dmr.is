

import { GridColumn } from '@island.is/island-ui/core/Grid/GridColumn/GridColumn'
import { GridContainer } from '@island.is/island-ui/core/Grid/GridContainer/GridContainer'
import { GridRow } from '@island.is/island-ui/core/Grid/GridRow/GridRow'
import { Hidden } from '@island.is/island-ui/core/Hidden/Hidden'
import { useBreakpoint } from '@island.is/island-ui/core/hooks/useBreakpoint'
import { Inline } from '@island.is/island-ui/core/Inline/Inline'
import { Logo } from '@island.is/island-ui/core/Logo/Logo'

import { ControlPanel, ControlPanelProps } from '../ControlPanel/ControlPanel'
import * as styles from './Header.css'

export type HeaderProps = {
  controlPanel?: ControlPanelProps
}

export const Header = ({ controlPanel }: HeaderProps) => {
  const { lg } = useBreakpoint()

  return (
    <Hidden print={true}>
      <header className={styles.header}>
        <GridContainer>
          <GridRow>
            <GridColumn span="12/12">
              <Inline alignY="center" justifyContent="spaceBetween">
                <Inline
                  alignY="center"
                  justifyContent="flexStart"
                  space={[2, 2, 4]}
                >
                  <Logo
                    id="header-logo"
                    width={lg ? 160 : 30}
                    iconOnly={lg ? false : true}
                  />

                  {controlPanel && <ControlPanel {...controlPanel} />}
                </Inline>
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </header>
    </Hidden>
  )
}
