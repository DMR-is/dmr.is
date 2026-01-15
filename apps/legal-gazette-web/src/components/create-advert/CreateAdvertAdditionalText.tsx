import {
  GridColumn,
  GridContainer,
  GridRow,
  Input,
} from '@dmr.is/ui/components/island-is'

type Props = {
  onChange?: (value: string) => void
}

export const CreateAdvertAdditionalText = ({ onChange }: Props) => {
  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]}>
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
      </GridRow>
    </GridContainer>
  )
}
