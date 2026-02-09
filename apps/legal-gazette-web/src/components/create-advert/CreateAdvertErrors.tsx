import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Bullet } from '@dmr.is/ui/components/island-is/Bullet'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

type Props = {
  errors: { path: string; message: string }[]
  onResetErrors: () => void
}

export const CreateAdvertErrors = ({ errors, onResetErrors }: Props) => {
  if (errors.length === 0) {
    return null
  }

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={'12/12'}>
          <Stack space={[2, 3]}>
            <AlertMessage
              type="error"
              title="Uppýsingar vantar eða eru ekki rétt fylltar út."
              message="Lagfærðu eftirfarandi villur og reyndu aftur:"
              action={
                <Button
                  size="small"
                  icon="close"
                  variant="ghost"
                  colorScheme="destructive"
                  onClick={onResetErrors}
                >
                  Fela villur
                </Button>
              }
            />
            <ul>
              {errors.map(({ path, message }, index) => {
                return (
                  <Bullet key={`${path}-${index}`}>
                    <Text fontWeight="regular" variant="medium">
                      {message}
                    </Text>
                  </Bullet>
                )
              })}
            </ul>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
