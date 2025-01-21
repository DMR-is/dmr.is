import { Box, BoxProps, Input, SkeletonLoader } from '@island.is/island-ui/core'

type Props = React.ComponentProps<typeof Input> & {
  width?: BoxProps['width']
  isValidating?: boolean
}

export const OJOIInput = ({ loading, isValidating, width, ...rest }: Props) => {
  return loading ? (
    <SkeletonLoader height={64} borderRadius="standard" />
  ) : (
    <Box width={width}>
      <Input
        size="sm"
        backgroundColor="blue"
        {...rest}
        loading={isValidating}
      />
    </Box>
  )
}
