import cn from 'classnames'
import { useEffect, useState } from 'react'

import { getDiff, HTMLDump } from '@dmr.is/regulations-tools/html'
import { HTMLText } from '@dmr.is/regulations-tools/types'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Drawer } from '@dmr.is/ui/components/island-is/Drawer'

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
  const [isOpen, setIsOpen] = useState(false)
  const [diffHtml, setDiffHtml] = useState<HTMLText | null>(null)

  const [orignal, _setOriginal] = useState(
    activeCase.history.length > 0
      ? activeCase.history[0].html
      : activeCase.html,
  )

  // Only compute the diff once the drawer is actually opened. Cleaning +
  // diffing the full body is expensive (and pulls in sanitize-html), so we
  // defer both the work and the chunk download until the user asks for it.
  useEffect(() => {
    if (!isOpen || activeText !== 'diff') return

    let cancelled = false
    const computeDiff = async () => {
      const { simpleSanitize } = await import(
        '@dmr.is/utils-server/cleanLegacyHtml'
      )
      const { diff } = getDiff(
        simpleSanitize(orignal) as HTMLText,
        simpleSanitize(activeCase.html) as HTMLText,
      )
      if (!cancelled) setDiffHtml(diff)
    }
    computeDiff()

    return () => {
      cancelled = true
    }
  }, [isOpen, activeText, activeCase.html, orignal])

  const diffShowing = activeText === 'diff'
  const html = diffShowing
    ? (diffHtml ?? ('' as HTMLText))
    : (orignal as HTMLText)

  return (
    <>
      <Drawer
        baseId="diff_drawer"
        ariaLabel="Sýna breytingar á meginmáli"
        onVisibilityChange={setIsOpen}
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
