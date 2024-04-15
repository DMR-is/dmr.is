import { MessageDescriptor } from 'react-intl'

import { ArrowLink, Box, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from './ContentWrapper.css'

type Props = {
  background?: 'white' | 'blue'
  children?: React.ReactNode
  title?: string | MessageDescriptor
  link?: string
  linkText?: string | MessageDescriptor
}

export const ContentWrapper = ({
  children,
  background = 'white',
  title,
  link,
  linkText,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <div
      className={styles.contentWrapper({
        background,
      })}
    >
      {title && (
        <Text marginBottom={2} variant="h4">
          {formatMessage(title)}
        </Text>
      )}
      {children}
      {link && (
        <Box marginTop={3}>
          <ArrowLink href={link}>{formatMessage(linkText)}</ArrowLink>
        </Box>
      )}
    </div>
  )
}
