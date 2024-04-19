import { Box, Icon, LinkV2, Tag, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import * as s from './CaseCard.css'
import { messages } from './messages'
type Props = {
  insitiution?: string | null
  department?: string | null
  publicationNumber?: string | null
  publicationDate?: string | null
  title?: string | null
  categories?: string[] | null
  link?: string | null
}

export const CaseCard = ({
  insitiution,
  department,
  publicationNumber,
  publicationDate,
  title,
  categories,
  link,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <Box display="flex" flexDirection="column" rowGap={1} className={s.wrapper}>
      {(insitiution || department || publicationDate) && (
        <Box display="flex" justifyContent="spaceBetween">
          {insitiution && (
            <Box>
              <Text variant="eyebrow" color="blueberry400">
                {insitiution}
              </Text>
            </Box>
          )}
          {(department || publicationDate) && (
            <Box>
              <Text variant="eyebrow" color="blueberry400">{`${department} ${
                department && publicationDate ? ' - ' : ''
              } ${
                publicationDate ? `Útg: ${formatDate(publicationDate)}` : ''
              }`}</Text>
            </Box>
          )}
        </Box>
      )}
      {publicationNumber && (
        <Box>
          <Text variant="h3">{publicationNumber}</Text>
        </Box>
      )}
      {title && (
        <Box>
          <Text>{title}</Text>
        </Box>
      )}
      <Box display="flex" justifyContent="spaceBetween" marginTop={2}>
        {categories && categories.length && (
          <Box display="flex" rowGap={1} columnGap={1}>
            {categories.map((cat) => {
              return (
                <Tag key={cat} variant="blue" outlined disabled>
                  {cat}
                </Tag>
              )
            })}
          </Box>
        )}
        {link && (
          <LinkV2
            href={link}
            color="blue400"
            underline="normal"
            underlineVisibility="always"
          >
            <Text as="span" fontWeight="medium" variant="small">
              {formatMessage(messages.general.moreLink)}
            </Text>
            <Icon icon="open" type="outline" size="small" />
          </LinkV2>
        )}
      </Box>
    </Box>
  )
}
