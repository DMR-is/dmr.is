import { Box } from '../../island-is/lib/Box'
import { GridColumn } from '../../island-is/lib/GridColumn'
import { GridContainer } from '../../island-is/lib/GridContainer'
import { GridRow } from '../../island-is/lib/GridRow'
import { LinkV2 } from '../../island-is/lib/LinkV2'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
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
      paddingY={3}
      border="standard"
      borderColor="blueberry200"
      borderRadius="large"
      background="white"
      display="flex"
      alignItems="center"
    >
      <GridContainer>
        <GridRow alignItems={'center'}>
          <GridColumn span={columnSpan.content}>
            <Stack space={1}>
              <Text variant="h3" as="h3" color="blue400" fontWeight="semiBold">
                <span>
                  <LinkV2 href={href} underline="normal">
                    {title}
                  </LinkV2>
                </span>
              </Text>
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
