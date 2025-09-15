'use client'

import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import { GridColumn, Input, Stack, Text } from '@dmr.is/ui/components/island-is'

import { GridRow, toast } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { useUpdateAdvert } from '../../../../hooks/useUpdateAdvert'
import { Editor } from '../../editor/HTMLEditor'

export const ContentFields = () => {
  const { advert } = useAdvertContext()

  if (!advert.caption && !advert.content) return null

  const { trigger } = useUpdateAdvert(advert.id)

  const silentHTMLUpdateHandler = useCallback(debounce(trigger, 500), [])

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
              onBlur={(event) =>
                trigger(
                  { caption: event.target.value },
                  {
                    onSuccess: () => {
                      toast.success('Yfirskrift vistað', {
                        toastId: 'caption-success',
                      })
                    },
                    onError: () => {
                      toast.error('Villa við að vista yfirskrift', {
                        toastId: 'caption-error',
                      })
                    },
                  },
                )
              }
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
              onChange={(val) =>
                silentHTMLUpdateHandler({
                  content: Buffer.from(val, 'utf-8').toString('base64'),
                })
              }
              onBlur={(value) =>
                trigger(
                  { content: Buffer.from(value, 'utf-8').toString('base64') },
                  {
                    onSuccess: () => {
                      toast.success('Efni vistað', {
                        toastId: 'content-success',
                      })
                    },
                    onError: () => {
                      toast.error('Villa við að vista efni', {
                        toastId: 'content-error',
                      })
                    },
                  },
                )
              }
            />
          </GridColumn>
        </GridRow>
      )}
    </Stack>
  )
}
