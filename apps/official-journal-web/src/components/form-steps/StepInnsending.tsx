import debounce from 'lodash/debounce'
import { useState } from 'react'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Tag,
} from '@island.is/island-ui/core'
import { HTMLText } from '@island.is/regulations-tools/types'

import { Case } from '../../gen/fetch'
import { useUpdateAdvertHtml } from '../../hooks/api/update/useUpdateAdvertHtml'
import { HTMLEditor } from '../editor/Editor'
type Props = {
  activeCase: Case
}
export const StepInnsending = ({ activeCase }: Props) => {
  const original = activeCase.html as HTMLText
  const { trigger: updateHtml } = useUpdateAdvertHtml({
    caseId: activeCase.id,
  })

  const [localHtml, setLocalHtml] = useState<HTMLText>(original)

  const handleHtmlChange = async (value: HTMLText) => {
    setLocalHtml(value)

    const dirtyClean = (
      await import('@island.is/regulations-tools/dirtyClean-browser')
    ).default

    const localClean = dirtyClean(value)
    const originalClean = dirtyClean(original)

    if (localClean !== originalClean) {
      updateHtml({
        advertHtml: value,
      })
    }
  }

  const debouncedHtmlChange = debounce(handleHtmlChange, 300)

  const debouncedHtmlHandler = (value: HTMLText) => {
    debouncedHtmlChange.cancel()
    debouncedHtmlChange(value)
  }

  return (
    <GridContainer>
      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Inline space={1}>
            {[activeCase.advertDepartment, ...activeCase.advertCategories]?.map(
              (cat) => (
                <Tag key={cat.id} variant="white" outlined disabled>
                  {cat.title}
                </Tag>
              ),
            )}
          </Inline>
        </GridColumn>
      </GridRow>

      <GridRow marginBottom={2} rowGap={2} alignItems="center">
        <GridColumn span={['12/12']}>
          <Box borderRadius="large" border="standard">
            <HTMLEditor
              defaultValue={original}
              onChange={debouncedHtmlHandler}
            />
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
