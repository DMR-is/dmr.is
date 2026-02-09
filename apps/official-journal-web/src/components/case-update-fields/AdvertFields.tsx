import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useUpdateAdvertHtml } from '../../hooks/api/update/useUpdateAdvertHtml'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useFileUploader } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
import { HTMLEditor } from '../editor/Editor'
import { messages } from '../form-steps/messages'
import * as styles from './AdvertFields.css'

const OriginalCompare = dynamic(
  () => import('../original-compare/OriginalCompare'),
  { ssr: false },
)

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const AdvertFields = ({ toggle, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()
  const { data: session } = useSession()

  const { currentCase, refetch, canEdit } = useCaseContext()

  const { trigger } = useUpdateAdvertHtml({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        toast.success('Meginmál auglýsingar uppfært', {
          toastId: 'updateAdvertFieldsHtml',
        })
        refetch()
      },
    },
  })

  const onChangeHandler = useCallback(debounce(trigger, 500), [])

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
          <HTMLEditor
            readonly={!canEdit}
            defaultValue={currentCase.html}
            onChange={(val) => onChangeHandler({ advertHtml: val })}
            handleUpload={fileUploader()}
          />
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
          <Link
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
          </Link>
        </Inline>
      </Stack>
    </AccordionItem>
  )
}
