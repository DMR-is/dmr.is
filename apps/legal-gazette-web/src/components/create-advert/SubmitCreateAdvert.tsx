import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'

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
