import cn from 'classnames'
import { useEffect, useState } from 'react'

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
  const { currentCase: activeCase } = useCaseContext()
  const [activeText, setActiveText] = useState<'base' | 'diff'>('diff')
  const [baseText, setBaseText] = useState<HTMLText>('')
  const [currentDiff, setCurrentDiff] = useState<HTMLText>('')

  useEffect(() => {
    if (!baseText && !currentDiff) {
      try {
        const baseParsed = JSON.parse(activeCase.comments?.[0]?.state).answers
          ?.advert?.html

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
