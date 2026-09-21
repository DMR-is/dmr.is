import cn from 'classnames'
import { useEffect, useState } from 'react'

import { getLogger } from '@dmr.is/logging-next'
import { getDiff, HTMLDump } from '@dmr.is/regulations-tools/html'
import { HTMLText } from '@dmr.is/regulations-tools/types'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Drawer } from '@dmr.is/ui/components/island-is/Drawer'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { useCaseContext } from '../../hooks/useCaseContext'
import * as s from './OriginalCompare.css'

const logger = getLogger('OriginalCompare')

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
  const [diffFailed, setDiffFailed] = useState(false)

  const [orignal, _setOriginal] = useState(
    activeCase.history.length > 0
      ? activeCase.history[0].html
      : activeCase.html,
  )

  // Only compute the diff once the drawer is actually opened. Cleaning +
  // diffing the full body is expensive, so we defer the work — and the
  // sanitize-html chunk it needs — until the user asks for it. getDiff and
  // HTMLDump themselves stay statically imported.
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

    setDiffFailed(false)
    computeDiff().catch((e) => {
      if (cancelled) return
      logger.error('Failed to compute advert diff', {
        caseId: activeCase.id,
        error: e instanceof Error ? e.message : String(e),
      })
      setDiffFailed(true)
    })

    return () => {
      cancelled = true
    }
  }, [isOpen, activeText, activeCase.html, activeCase.id, orignal])

  const diffShowing = activeText === 'diff'
  const diffPending = diffShowing && !diffFailed && diffHtml === null
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

        {diffShowing && diffFailed ? (
          <AlertMessage
            type="error"
            title="Ekki tókst að reikna breytingar"
            message="Villa kom upp við samanburð á texta. Veldu „Sjá grunntexta“ eða reyndu aftur síðar."
          />
        ) : diffPending ? (
          <SkeletonLoader repeat={4} height={24} space={2} />
        ) : (
          !isValidating && (
            <HTMLDump
              key={lastFetched}
              className={cn(s.editor, s.diff)}
              html={html}
            />
          )
        )}
      </Drawer>
    </>
  )
}

export default OriginalCompare
