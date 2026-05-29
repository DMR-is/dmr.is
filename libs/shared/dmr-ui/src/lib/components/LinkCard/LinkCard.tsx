import { FocusableBox } from '../../island-is'
import { Box } from '../../island-is/lib/Box'
import { Hidden } from '../../island-is/lib/Hidden'
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

  return (
    <FocusableBox
      height="full"
      paddingX={4}
      paddingY={3}
      border="standard"
      borderColor="blueberry200"
      borderRadius="large"
      background="white"
      display="flex"
      flexDirection={['columnReverse', 'columnReverse', 'columnReverse', 'row']}
      alignItems={['flexStart', 'flexStart', 'flexStart', 'center']}
      rowGap={2}
      columnGap={2}
      href={href}
    >
      <Box
        display={'flex'}
        flexDirection="column"
        justifyContent="flexStart"
        rowGap={1}
        height="full"
      >
        <Text variant="h3" as="h3" color="blue400" fontWeight="semiBold">
          {title}
        </Text>
        {description && <Text>{description}</Text>}
      </Box>
      <Hidden below="lg">
        {hasImage && (
          <Box height="full">
            <Image {...image} />
          </Box>
        )}
      </Hidden>
    </FocusableBox>
  )
}
