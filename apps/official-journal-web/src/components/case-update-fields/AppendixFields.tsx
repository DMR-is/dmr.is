import { useSession } from 'next-auth/react'

import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import {
  AccordionItem,
  Box,
  Button,
  Inline,
  Stack,
  Text,
  toast,
} from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { getDmrClient } from '../../lib/api/createClient'
import { useFileUploader } from '../../lib/utils'
import { HTMLEditor } from '../editor/Editor'
import { OJOIInput } from '../select/OJOIInput'
import * as styles from './AdvertFields.css'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const AppendixFields = ({ toggle, onToggle }: Props) => {
  const { data: session } = useSession()

  const { currentCase, refetch, canEdit } = useCaseContext()
  const dmrClient = getDmrClient(session?.idToken as string)

  const updateAppendix = async (
    id: string,
    body: { content?: string; title?: string; order?: number },
  ) => {
    await dmrClient
      .updateAdvertAppendix({
        id: currentCase.id,
        updateAdvertAppendixBody: {
          content: body.content ?? null,
          title: body.title ?? null,
          additionId: id,
          order: typeof body.order === 'number' ? body.order.toString() : null,
        },
      })
      .then(() => {
        refetch()
        toast.success('Viðaukar uppfærðir', {
          toastId: 'updateAppendix',
        })
      })
      .catch((err) => {
        toast.error('Villa við uppfærslu viðauka', {
          toastId: 'updateAppendix',
        })
      })
  }

  const onChangeHandler = useCallback(debounce(updateAppendix, 500), [])

  const fileUploader = useFileUploader(
    currentCase.applicationId ?? 'no-application-id',
    currentCase.id,
    session?.idToken as string,
  )

  return (
    <AccordionItem
      id="AppendixFields"
      expanded={toggle}
      onToggle={onToggle}
      label="Viðaukar/fylgiskjöl"
      labelVariant="h5"
      iconVariant="small"
    >
      <Stack space={4}>
        {currentCase.additions.length === 0 && (
          <Text variant="small" paddingBottom={2}>
            Engir viðaukar skráðir á málið
          </Text>
        )}
        {currentCase.additions.map((addition, additionIndex) => {
          return (
            <Box
              key={addition.id}
              className={styles.fieldBody}
              border="standard"
              borderRadius="standard"
              padding={2}
            >
              <Stack space={2}>
                <OJOIInput
                  label="Titill viðauka"
                  placeholder="Titill viðauka"
                  disabled={!canEdit}
                  name={`additionTitle-${additionIndex}`}
                  defaultValue={addition.title}
                  onBlur={(e) => {
                    onChangeHandler(addition.id, {
                      title: e.target.value,
                      content: addition.html,
                    })
                  }}
                />
                <HTMLEditor
                  readonly={!canEdit}
                  defaultValue={addition.html}
                  onBlur={(val) =>
                    onChangeHandler(addition.id, {
                      content: val,
                      title: addition.title,
                    })
                  }
                  handleUpload={fileUploader()}
                />
                <Box display="flex" justifyContent="spaceBetween">
                  <Button
                    variant="utility"
                    colorScheme="destructive"
                    icon="trash"
                    iconType="outline"
                    size="small"
                    disabled={!canEdit}
                    onClick={async () =>
                      await dmrClient
                        .deleteAdvertAppendix({
                          id: currentCase.id,
                          deleteAdvertAppendixBody: {
                            additionId: addition.id,
                          },
                        })
                        .then(() => {
                          refetch()
                          toast.success('Viðauki fjarlægður', {
                            toastId: 'updateAppendix',
                          })
                        })
                    }
                  >
                    Fjarlægja viðauka
                  </Button>
                  <Box display="flex" justifyContent="spaceBetween">
                    <Button
                      variant="ghost"
                      size="small"
                      icon="arrowUp"
                      circle={true}
                      disabled={additionIndex === 0 || !canEdit}
                      onClick={() =>
                        onChangeHandler(addition.id, {
                          order: addition.order - 1,
                        })
                      }
                    />
                    <Box marginX={1} />
                    <Button
                      variant="ghost"
                      iconType="outline"
                      size="small"
                      icon="arrowDown"
                      circle={true}
                      disabled={
                        additionIndex === currentCase.additions.length - 1 ||
                        !canEdit
                      }
                      onClick={() =>
                        onChangeHandler(addition.id, {
                          order: addition.order + 1,
                        })
                      }
                    />
                  </Box>
                </Box>
              </Stack>
            </Box>
          )
        })}
        <Inline space={2} flexWrap="wrap">
          <Button
            disabled={currentCase.additions.length >= 10 || !canEdit}
            variant="utility"
            icon="add"
            size="small"
            onClick={async () =>
              await dmrClient
                .createAdvertAppendix({
                  id: currentCase.id,
                  createAdvertAppendixBody: {
                    content: '',
                    title: `Viðauki ${currentCase.additions ? currentCase.additions.length + 1 : ''}`,
                  },
                })
                .then(() => {
                  refetch()
                })
            }
          >
            Bæta við nýjum viðauka
          </Button>
        </Inline>
      </Stack>
    </AccordionItem>
  )
}
