import cn from 'classnames'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { ModalBase } from '@dmr.is/ui/components/island-is/ModalBase'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useCaseContext } from '../../hooks/useCaseContext'
import { formatDate } from '../../lib/utils'
import { Appendixes } from '../appendixes/Appendixes'
import * as styles from './AdvertDisplay.css'

type Props = {
  disclosure: React.ComponentProps<typeof ModalBase>['disclosure']
}
export const AdvertDisplay = ({ disclosure }: Props) => {
  const { currentCase } = useCaseContext()

  const { requestedPublicationDate } = currentCase

  return (
    <ModalBase baseId="myDialog" disclosure={disclosure}>
      {({ closeModal }) => (
        <GridContainer>
          <GridRow>
            <GridColumn span="12/12">
              <Box
                className={cn(styles.modalBackground, {
                  [styles.advertSignature]: currentCase.hideSignatureDate,
                })}
              >
                <Inline justifyContent="flexEnd">
                  <Button
                    onClick={closeModal}
                    icon="close"
                    circle
                    iconType="outline"
                  />
                </Inline>
                <Box className={styles.wrapper}>
                  <Box
                    border="standard"
                    borderColor="purple200"
                    borderRadius="large"
                    padding={[2, 3, 4]}
                    background="white"
                  >
                    <Box display="flex" justifyContent="spaceBetween">
                      <Text variant="eyebrow" color="purple400">
                        Nr. 000/{new Date().getFullYear()}
                      </Text>
                      {currentCase.hideSignatureDate ? null : (
                        <Text variant="eyebrow" color="purple400">
                          {formatDate(requestedPublicationDate, 'd. MMMM yyyy')}
                        </Text>
                      )}
                    </Box>
                    <Box textAlign="center" marginBottom={[2, 3, 4]}>
                      <Text variant="h3">{currentCase.advertType.title}</Text>
                      <Text variant="h4">{currentCase.advertTitle}</Text>
                    </Box>
                    <Box
                      className={styles.bodyText}
                      dangerouslySetInnerHTML={{
                        __html: currentCase.html,
                      }}
                    />
                    <Box
                      className={styles.bodyText}
                      dangerouslySetInnerHTML={{
                        __html: currentCase.signature?.html ?? '',
                      }}
                    />
                    {currentCase.additions &&
                    currentCase.additions.length > 0 ? (
                      <Appendixes additions={currentCase.additions} />
                    ) : undefined}
                    <p
                      style={{
                        marginTop: '1.5em',
                        marginBottom: '1.5em',
                        textAlign: 'center',
                      }}
                    >
                      <strong>
                        {currentCase.advertDepartment.title} - Útgáfudagur:{' '}
                        {formatDate(requestedPublicationDate, 'd. MMMM yyyy')}
                      </strong>
                    </p>
                  </Box>
                </Box>
              </Box>
            </GridColumn>
          </GridRow>
        </GridContainer>
      )}
    </ModalBase>
  )
}
