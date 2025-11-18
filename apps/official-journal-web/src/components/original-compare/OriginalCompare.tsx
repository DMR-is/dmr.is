import cn from 'classnames'
import { useMemo, useState } from 'react'

import dirtyClean from '@dmr.is/regulations-tools/dirtyClean-browser'
import { getDiff, HTMLDump } from '@dmr.is/regulations-tools/html'
import { HTMLText } from '@dmr.is/regulations-tools/types'

import { Button, Drawer } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import * as s from './OriginalCompare.css'

type Props = {
  disclosure?: React.ComponentProps<typeof Drawer>['disclosure']
}

export const OriginalCompare = ({ disclosure }: Props) => {
  const {
    currentCase: activeCase,
    lastFetched,
    isValidating,
  } = useCaseContext()
  const [activeText, setActiveText] = useState<'base' | 'diff'>('diff')

  const [orignal, _setOriginal] = useState(
    activeCase.history.length > 0
      ? activeCase.history[0].html
      : activeCase.html,
  )

  const html = useMemo(() => {
    if (activeText === 'base') return orignal as HTMLText

    const diffText = getDiff(
      dirtyClean(orignal as HTMLText),
      dirtyClean(activeCase.html as HTMLText),
    )

    return diffText.diff
  }, [activeCase.html, activeText])

  const diffShowing = activeText === 'diff'

  return (
    <>
      <Drawer
        baseId="diff_drawer"
        ariaLabel="Sýna breytingar á meginmáli"
        disclosure={
          disclosure ? (
            disclosure
          ) : (
            <Button
              title="Skoða breytingar á meginmáli"
              circle
              icon="document"
            />
          )
        }
      >
        <Button
          onClick={() => {
            if (diffShowing) {
              setActiveText('base')
            } else {
              setActiveText('diff')
            }
          }}
          variant="text"
        >
          {diffShowing ? 'Sjá grunntexta' : 'Sjá breytingar'}
        </Button>

        {!isValidating === true && (
          <HTMLDump
            key={lastFetched}
            className={cn(s.editor, s.diff)}
            html={html}
          />
        )}
      </Drawer>
    </>
  )
}

export default OriginalCompare
