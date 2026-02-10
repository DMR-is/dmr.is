import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { Input } from '@dmr.is/ui/components/island-is/Input'

type Props = {
  onChange?: (value: string) => void
}

export const CreateAdvertAdditionalText = ({ onChange }: Props) => {
  return (
    <GridColumn span="12/12">
      <Input
        backgroundColor="blue"
        name="new-advert.additional-text"
        label="Frjáls texti"
        textarea
        rows={2}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </GridColumn>
  )
}
