import debounce from 'lodash/debounce'
import dynamic from 'next/dynamic'

import {
  AccordionItem,
  Box,
  Button,
  Inline,
  Stack,
  toast,
} from '@island.is/island-ui/core'

import { useUpdateAdvertHtml } from '../../hooks/api/update/useUpdateAdvertHtml'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { HTMLEditor } from '../editor/Editor'
import { messages } from '../form-steps/messages'

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

  const { currentCase, refetch } = useCaseContext()

  const { trigger } = useUpdateAdvertHtml({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        toast.success('Meginmál auglýsingar uppfært')
        refetch()
      },
    },
  })

  const debouncedUpdate = debounce(trigger, 500)

  const onChangeHandler = (val: string) => {
    debouncedUpdate.cancel()
    debouncedUpdate({
      advertHtml: val,
    })
  }

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
        <Box border="standard" borderRadius="large">
          <HTMLEditor
            defaultValue={currentCase.html}
            onChange={(val) => onChangeHandler(val)}
          />
        </Box>
        <Inline justifyContent="flexEnd">
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
        </Inline>
      </Stack>
    </AccordionItem>
  )
}
