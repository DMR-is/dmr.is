import { FocusableBox } from '../../island-is'
import { Box } from '../../island-is/lib/Box'
import { GridColumn } from '../../island-is/lib/GridColumn'
import { GridContainer } from '../../island-is/lib/GridContainer'
import { GridRow } from '../../island-is/lib/GridRow'
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
    <FocusableBox
      height="full"
      paddingX={3}
      paddingY={3}
      border="standard"
      borderColor="blueberry200"
      borderRadius="large"
      background="white"
      display="flex"
      alignItems="stretch"
      href={href}
    >
      <GridContainer>
        <GridRow alignItems={'stretch'}>
          <GridColumn span={columnSpan.content}>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="flexStart"
            >
              <Text
                variant="h3"
                as="h3"
                color="blue400"
                fontWeight="semiBold"
              >
                {title}
              </Text>
              {description && <Text paddingTop={2}>{description}</Text>}
            </Box>
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
    </FocusableBox>
  )
}
