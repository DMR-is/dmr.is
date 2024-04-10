import { Box, Tag, Text } from '@island.is/island-ui/core'

import { formatDate } from '../../lib/utils'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'

type Props = {
  insitiution?: string | null
  department?: string | null
  publicationNumber?: string | null
  publicationDate?: string | null
  title?: string | null
  categories?: string[] | null
}

export const CaseCard = ({
  insitiution,
  department,
  publicationNumber,
  publicationDate,
  title,
  categories,
}: Props) => {
  return (
    <ContentWrapper background="white">
      <Box display="flex" flexDirection="column" rowGap={1}>
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
        {categories && categories.length && (
          <Box marginTop={2} display="flex" rowGap={1} columnGap={1}>
            {categories.map((cat, index) => {
              return (
                <Tag key={index} variant="blue" outlined>
                  {cat}
                </Tag>
              )
            })}
          </Box>
        )}
      </Box>
    </ContentWrapper>
  )
}
