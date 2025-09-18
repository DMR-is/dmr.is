import {
  Button,
  DatePicker,
  Divider,
  Inline,
  Input,
  Select,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

export const SearchSidebar = () => {
  return (
    <Stack space={[1, 2]}>
      <Text variant="h4">Leit</Text>
      <Input placeholder="Leit í Lögbirtingablaðinu" name="search" size="sm" />
      <Divider />
      <Inline justifyContent="spaceBetween" alignY="center">
        <Text variant="h4">Síur</Text>
        <Button variant="text" size="small">
          Hreinsa síur
        </Button>
      </Inline>
      <Select label="Tegund" options={[]} size="xs" />
      <Select label="Flokkur" options={[]} size="xs" />
      <DatePicker label="Dagsetning frá" size="xs" placeholderText="" />
      <DatePicker label="Dagsetning til" size="xs" placeholderText="" />
    </Stack>
  )
}
