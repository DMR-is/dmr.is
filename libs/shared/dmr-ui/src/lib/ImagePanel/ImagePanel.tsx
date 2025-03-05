import {
  ArrowLink,
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'
import { Image, ImageProps } from '../Image/Image'
import { CallToAction } from '../CallToAction/CallToAction'

type ImagePanelProps = {
  title?: string
  description?: string
  link?: string
  linkText?: string
  image: ImageProps
  align?: 'left' | 'right'
}

export const ImagePanel = ({
  title,
  description,
  link,
  linkText,
  image,
  align = 'left',
}: ImagePanelProps) => {
  const hasImage = image && image.src
  const isLeftAligned = align === 'left'

  return (
    <GridContainer>
      <GridRow
        direction={
          isLeftAligned
            ? ['columnReverse', 'columnReverse', 'row']
            : ['column', 'column', 'row']
        }
      >
        <GridColumn
          offset={['0', '0', '1/12']}
          span={['12/12', '12/12', '5/12']}
        >
          {isLeftAligned ? (
            <Box height="full" display="flex" alignItems="center">
              <CallToAction
                title={title}
                description={description}
                link={link}
                linkText={linkText}
              />
            </Box>
          ) : (
            hasImage && <Image {...image} />
          )}
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '5/12']}>
          {isLeftAligned ? (
            hasImage && <Image {...image} />
          ) : (
            <Box height="full" display="flex" alignItems="center">
              <CallToAction
                title={title}
                description={description}
                link={link}
                linkText={linkText}
              />
            </Box>
          )}
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
