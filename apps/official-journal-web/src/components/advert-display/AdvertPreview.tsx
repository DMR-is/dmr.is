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
import { getMostRecentSignature } from '../../lib/utils'
import * as styles from './AdvertDisplay.css'

type Props = {
  disclosure: React.ComponentProps<typeof ModalBase>['disclosure']
}
export const AdvertPreview = ({ disclosure }: Props) => {
  const { currentCase } = useCaseContext()
  const { html: signatureHtml, records } = currentCase.signature

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
                        Nr. {currentCase.caseNumber}
                      </Text>
                      <Text variant="eyebrow" color="purple400">
                        {getMostRecentSignature(currentCase.signature, true)}
                      </Text>
                    </Box>
                    <Box textAlign="center" marginBottom={[2, 3, 4]}>
                      <Text variant="h3">{currentCase.advertType.title}</Text>
                      <Text variant="h4">{currentCase.advertTitle}</Text>
                    </Box>
                    <Box
                      className={styles.bodyText}
                      dangerouslySetInnerHTML={{
                        __html: currentCase.html + signatureHtml,
                      }}
                    ></Box>
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
