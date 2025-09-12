'use client'

import { GridColumn, Input, Stack, Text } from '@dmr.is/ui/components/island-is'

import { GridRow } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { Editor } from '../../editor/HTMLEditor'

export const ContentFields = () => {
  const { advert } = useAdvertContext()

  if (!advert.caption && !advert.content) return null

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span="12/12">
          <Text variant="h3">Efni auglýsingar</Text>
        </GridColumn>
      </GridRow>
      {!!advert.caption && (
        <GridRow>
          <GridColumn span="12/12">
            <Input
              size="sm"
              backgroundColor="blue"
              name="caption"
              label="Yfirskrift"
              defaultValue={advert.caption}
            />
          </GridColumn>
        </GridRow>
      )}
      {!!advert.content && (
        <GridRow>
          <GridColumn span="12/12">
            <Editor
              defaultValue={Buffer.from(advert.content, 'base64').toString(
                'utf-8',
              )}
            />
          </GridColumn>
        </GridRow>
      )}
    </Stack>
  )
}
