import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  ModalBase,
  Text,
} from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { formatDate } from '../../lib/utils'
import { Appendixes } from '../appendixes/Appendixes'
import * as styles from './AdvertDisplay.css'

type Props = {
  disclosure: React.ComponentProps<typeof ModalBase>['disclosure']
}
export const AdvertDisplay = ({ disclosure }: Props) => {
  const { currentCase } = useCaseContext()

  const { signatureDate } = currentCase.signature

  return (
    <ModalBase baseId="myDialog" disclosure={disclosure}>
      {({ closeModal }) => (
        <GridContainer>
          <GridRow>
            <GridColumn span="12/12">
              <Box className={styles.modalBackground}>
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
                      <Text variant="eyebrow" color="purple400">
                        {formatDate(signatureDate, 'd. MMMM yyyy')}
                      </Text>
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
                        {currentCase.advertDepartment.title} - Útgáfud.:{' '}
                        {formatDate(new Date(), 'd. MMMM yyyy')}
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
