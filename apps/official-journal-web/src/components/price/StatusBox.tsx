import { Box, Icon, Text } from '@island.is/island-ui/core'

export const PriceCalculatorStatusBox = ({
  success,
  text,
}: {
  success: boolean
  text: string
}) => {
  return (
    <Box display="flex" alignItems="center">
      {success ? (
        <Icon icon="checkmarkCircle" color="mint400" />
      ) : (
        <Icon icon="informationCircle" color="blueberry300" />
      )}
      <Box marginRight={1} />
      <Text>{text}</Text>
    </Box>
  )
}
