'use client'


import {
  AlertMessage,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'


export default function Error({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <AlertMessage
            type="error"
            title="Villa"
            message="Villa kom upp við að sækja tengdar auglýsingar"
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
