import cn from 'classnames'
import { useEffect, useState } from 'react'

import { Button, Drawer } from '@island.is/island-ui/core'
import dirtyClean from '@island.is/regulations-tools/dirtyClean-browser'
import { getDiff, HTMLDump } from '@island.is/regulations-tools/html'
import { HTMLText } from '@island.is/regulations-tools/types'

import { CaseDetailed } from '../../gen/fetch'
import * as s from './OriginalCompare.css'

export type OriginalCompareProps = {
  activeCase: CaseDetailed
}

export const OriginalCompare = ({ activeCase }: OriginalCompareProps) => {
  const [activeText, setActiveText] = useState<'base' | 'diff'>('base')
  const [baseText, setBaseText] = useState<HTMLText>('')
  const [currentDiff, setCurrentDiff] = useState<HTMLText>('')

  useEffect(() => {
    if (!baseText && !currentDiff) {
      try {
        const baseParsed = (
          activeCase.history.length > 0
            ? activeCase.history[0].html
            : activeCase.html
        ) as HTMLText

        const currentActive = activeCase.html

        const diffText = getDiff(
          dirtyClean(baseParsed as HTMLText),
          dirtyClean(currentActive as HTMLText),
        )

        setBaseText(baseParsed)
        setCurrentDiff(diffText.diff)
      } catch (e) {
        setBaseText('')
      }
    }
  }, [activeCase?.comments])

  if (!activeText || !baseText) {
    return null
  }

  const diffShowing = activeText === 'diff'
  return (
    <>
      <Drawer
        baseId="diff_drawer"
        ariaLabel="Sýna breytingar á meginmáli"
        disclosure={
          <Button
            title="Skoða upprunalega útgáfu"
            circle
            icon="document"
          ></Button>
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
          {diffShowing ? 'Sjá grunntexta' : 'Sjá breytingar'}{' '}
        </Button>
        <HTMLDump
          className={cn(s.editor, s.diff)}
          html={diffShowing ? currentDiff : baseText}
        />
      </Drawer>
    </>
  )
}

export default OriginalCompare
