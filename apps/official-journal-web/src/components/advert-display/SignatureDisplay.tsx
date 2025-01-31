import { Box } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import * as styles from './AdvertDisplay.css'

export const SignatureDislay = () => {
  const { currentCase } = useCaseContext()

  const signatureHTML = currentCase.signatures.map((s) => s.html).join('')

  return (
    <Box
      border="standard"
      borderRadius="large"
      padding={[2, 2, 3]}
      className={styles.bodyText}
      dangerouslySetInnerHTML={{
        __html: signatureHTML,
      }}
    />
  )
}
