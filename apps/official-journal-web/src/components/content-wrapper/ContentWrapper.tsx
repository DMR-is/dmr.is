import { ArrowLink, Box, Text } from '@island.is/island-ui/core'

import * as styles from './ContentWrapper.css'

type Props = {
  background?: 'white' | 'blue'
  children?: React.ReactNode
  title?: string
  link?: string
  linkText?: string
}

export const ContentWrapper = ({
  children,
  background = 'white',
  title,
  link,
  linkText,
}: Props) => {
  return (
    <div
      className={styles.contentWrapper({
        background,
      })}
    >
      {title && (
        <Text marginBottom={2} variant="h4">
          {title}
        </Text>
      )}
      {children}
      {link && (
        <Box marginTop={3}>
          <ArrowLink href={link}>{linkText}</ArrowLink>
        </Box>
      )}
    </div>
  )
}
