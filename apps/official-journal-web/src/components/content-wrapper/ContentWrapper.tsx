import { MessageDescriptor } from 'react-intl'

import { ArrowLink, Box, Text, TextProps } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from './ContentWrapper.css'

type Props = {
  background?: 'white' | 'blue'
  children?: React.ReactNode
  title?: string | MessageDescriptor
  link?: string
  linkText?: string | MessageDescriptor
  titleVariant?: TextProps['variant']
  titleAs?: TextProps['as']
}

export const ContentWrapper = ({
  children,
  background = 'white',
  title,
  link,
  linkText,
  titleVariant = 'h4',
  titleAs = 'h3',
}: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <div
      className={styles.contentWrapper({
        background,
      })}
    >
      {title && (
        <Text marginBottom={2} variant={titleVariant} as={titleAs}>
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
