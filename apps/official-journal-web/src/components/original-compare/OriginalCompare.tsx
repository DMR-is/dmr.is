import cn from 'classnames'
import { useMemo, useState } from 'react'

import { Button, Drawer } from '@island.is/island-ui/core'
import dirtyClean from '@island.is/regulations-tools/dirtyClean-browser'
import { getDiff, HTMLDump } from '@island.is/regulations-tools/html'
import { HTMLText } from '@island.is/regulations-tools/types'

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
  // we only want to compare to the lastest change so we never updated this, only on mount
  const [orignal, _setOriginal] = useState(
    activeCase.history[activeCase.history.length - 1].html,
  )

  // we can implement in the future to compare to the base based on the indexes of the history array
  // for now we use the lastest changes to compare to that
  const [base, _setBase] = useState(
    activeCase.history.length > 0
      ? activeCase.history[0].html
      : activeCase.html,
  )

  const html = useMemo(() => {
    if (activeText === 'base') return orignal as HTMLText

    const diffText = getDiff(
      dirtyClean(base as HTMLText),
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
