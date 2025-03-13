import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Hyphen,
  LinkV2,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { Image, ImageProps } from '../Image/Image'
export type LinkCardProps = {
  href: string
  title: string
  description?: string
  image?: ImageProps
}

export const LinkCard = ({
  href,
  title,
  description,
  image,
}: LinkCardProps) => {
  const hasImage = !!(image && image.src)
  const columnSpan: Record<
    string,
    React.ComponentProps<typeof GridColumn>['span']
  > = {
    content: hasImage ? ['12/12', '12/12', '12/12', '8/12'] : '12/12',
    image: ['12/12', '12/12', '12/12', '4/12'],
  }

  return (
    <Box
      height="full"
      paddingX={3}
      paddingY={2}
      border="standard"
      borderColor="blueberry200"
      borderRadius="large"
      background="white"
    >
      <GridContainer>
        <GridRow>
          <GridColumn span={columnSpan.content}>
            <Stack space={1}>
              <LinkV2 href={href}>
                <Text
                  variant="h3"
                  as="h3"
                  color="blue400"
                  fontWeight="semiBold"
                >
                  <Hyphen>{title}</Hyphen>
                </Text>
              </LinkV2>
              {description && <Text>{description}</Text>}
            </Stack>
          </GridColumn>
          {hasImage && (
            <GridColumn hiddenBelow="lg" span={columnSpan.image}>
              <Box height="full">
                <Image {...image} />
              </Box>
            </GridColumn>
          )}
        </GridRow>
      </GridContainer>
    </Box>
  )
}
