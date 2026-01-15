import {
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
} from '@dmr.is/ui/components/island-is'

type Props = {
  onSubmit: () => void
  isPending: boolean
}

export const SubmitCreateAdvert = ({ onSubmit, isPending }: Props) => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <Inline align="right">
            <Button loading={isPending} onClick={onSubmit}>
              Búa til auglýsingu
            </Button>
          </Inline>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
