import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'

type Props = {
  title?: string
  subTitle?: string | React.ReactNode
  children?: React.ReactNode
}

export const FormGroup = ({
  title = '',
  subTitle,
  children,
}: React.PropsWithChildren<Props>) => {
  const hasSubTitle = !!subTitle

  return (
    <GridRow rowGap={[2,3]} marginBottom={2}>
      {title !== '' && (
        <GridColumn span="12/12">
          <Text variant="h4">
            {title}
          </Text>
          {hasSubTitle && typeof subTitle === 'string' && (
            <Text variant="small" color="dark400">
              {subTitle}
            </Text>
          )}
          {hasSubTitle && typeof subTitle !== 'string' && subTitle}
        </GridColumn>
      )}
      {children}
    </GridRow>
  )
}
