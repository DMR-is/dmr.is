import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'

import debounce from 'lodash/debounce'
import { useCallback, useEffect, useState } from 'react'

import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { useFileUploader } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { HTMLEditor } from '../editor/Editor'
import { messages } from '../form-steps/messages'
import * as styles from './AdvertFields.css'

import { useMutation } from '@tanstack/react-query'

const OriginalCompare = dynamic(
  () => import('../original-compare/OriginalCompare'),
  { ssr: false },
)

const AdvertCompare = dynamic(() => import('../advert-compare/AdvertCompare'), {
  ssr: false,
})

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const AdvertFields = ({ toggle, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()
  const { data: session } = useSession()
  const trpc = useTRPC()

  const { currentCase, refetch, canEdit } = useCaseContext()

  // The editor is expensive to start on long adverts, so it does not hold up
  // the page: it starts once the browser is idle after load, which usually
  // has it ready before anyone expands this item, or right away on an earlier
  // expand. It then stays mounted, keeping its undo history across collapse
  // and expand.
  const [editorMounted, setEditorMounted] = useState(toggle)
  if (toggle && !editorMounted) {
    setEditorMounted(true)
  }

  useEffect(() => {
    if (editorMounted) return
    const mount = () => setEditorMounted(true)
    // Safari has no requestIdleCallback
    if (typeof window.requestIdleCallback !== 'function') {
      const timer = setTimeout(mount, 1000)
      return () => clearTimeout(timer)
    }
    const handle = window.requestIdleCallback(mount)
    return () => window.cancelIdleCallback(handle)
  }, [editorMounted])

  const updateAdvertHtml = useMutation(
    trpc.updateAdvertHtml.mutationOptions({
      onSuccess: () => {
        toast.success('Meginmál auglýsingar uppfært', {
          toastId: 'updateAdvertFieldsHtml',
        })
        refetch()
      },
    }),
  )

  const onChangeHandler = useCallback(
    debounce((args: { advertHtml: string }) => {
      updateAdvertHtml.mutate({ id: currentCase.id, ...args })
    }, 500),
    [currentCase.id],
  )

  const fileUploader = useFileUploader(
    currentCase.applicationId ?? 'no-application-id',
    currentCase.id,
    session?.idToken as string,
  )

  return (
    <AccordionItem
      id="advertFields"
      expanded={toggle}
      onToggle={onToggle}
      label={formatMessage(messages.yfirlestur.group1title)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Stack space={2}>
        <Box
          className={styles.fieldBody}
          border="standard"
          borderRadius="large"
        >
          {editorMounted && (
            <HTMLEditor
              readonly={!canEdit}
              defaultValue={currentCase.html}
              onChange={(val) => onChangeHandler({ advertHtml: val })}
              handleUpload={fileUploader()}
            />
          )}
        </Box>
        <Inline space={2} justifyContent="flexEnd">
          <OriginalCompare
            disclosure={
              <Button
                variant="utility"
                icon="document"
                iconType="outline"
                size="small"
              >
                Breytingarsaga
              </Button>
            }
          />
          <AdvertCompare
            disclosure={
              <Button
                variant="utility"
                icon="documents"
                iconType="outline"
                size="small"
              >
                Samanburður
              </Button>
            }
          />
          <AdvertDisplay
            disclosure={
              <Button
                variant="utility"
                size="small"
                icon="open"
                iconType="outline"
              >
                Forskoðun
              </Button>
            }
          />
          {/* A plain anchor, not next/link: Link prefetches when it scrolls into
              view, and prefetching this route generates the whole PDF. */}
          <a
            href={`/api/cases/${currentCase.id}/previewPdf`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkButton}
          >
            <Button
              variant="utility"
              size="small"
              icon="document"
              iconType="outline"
              as="span"
            >
              Skoða PDF forskoðun
            </Button>
          </a>
        </Inline>
      </Stack>
    </AccordionItem>
  )
}
