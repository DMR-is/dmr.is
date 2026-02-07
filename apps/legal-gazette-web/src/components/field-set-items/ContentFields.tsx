'use client'

import { isBase64 } from 'class-validator'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'
import { Editor } from '../editor/HTMLEditor'

type ContentFieldsProps = {
  id: string
  canEdit: boolean
  caption: string
  content: string
}

export const ContentFields = ({
  id,
  caption,
  content,
  canEdit,
}: ContentFieldsProps) => {
  const { updateCaption, updateContent } = useUpdateAdvert(id)

  const decodedContent = isBase64(content)
    ? Buffer.from(content, 'base64').toString('utf-8')
    : content

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span="12/12">
          <Input
            disabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            name="caption"
            label="Yfirskrift"
            defaultValue={caption}
            onBlur={(evt) => updateCaption(evt.target.value)}
          />
        </GridColumn>
      </GridRow>

      <GridRow>
        <GridColumn span="12/12">
          <Editor
            disabled={!canEdit}
            defaultValue={decodedContent}
            onBlur={(value) => updateContent({ content: value })}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
