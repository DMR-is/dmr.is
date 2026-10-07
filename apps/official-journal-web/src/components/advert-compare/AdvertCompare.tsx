import { useEffect, useId, useState } from 'react'

import { getLogger } from '@dmr.is/logging-next'
import { HTMLDump } from '@dmr.is/regulations-tools/html'
import { HTMLText } from '@dmr.is/regulations-tools/types'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { FocusableBox } from '@dmr.is/ui/components/island-is/FocusableBox'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { ModalBase } from '@dmr.is/ui/components/island-is/ModalBase'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatDate } from '../../lib/utils'
import * as styles from './AdvertCompare.css'

const logger = getLogger('AdvertCompare')

const SEARCH_DEBOUNCE_MS = 300

type SelectedAdvert = {
  id: string
  title: string
  publicationNumber: string | null
}

type Props = {
  disclosure: React.ComponentProps<typeof ModalBase>['disclosure']
}

export const AdvertCompare = ({ disclosure }: Props) => {
  const baseId = useId()

  // removeOnClose unmounts the content, so every opening starts from a fresh
  // search and diffs against the Meginmál as it is now.
  return (
    <ModalBase baseId={baseId} disclosure={disclosure} removeOnClose>
      {({ closeModal }) => <AdvertCompareContent closeModal={closeModal} />}
    </ModalBase>
  )
}

const AdvertCompareContent = ({ closeModal }: { closeModal: () => void }) => {
  const [selected, setSelected] = useState<SelectedAdvert | null>(null)

  return (
    <Box className={styles.modal}>
      <Inline justifyContent="spaceBetween" alignY="center">
        <Stack space={0}>
          <Text variant="h3">Samanburður</Text>
          <Text variant="small">
            {selected
              ? `Meginmál borið saman við ${selected.publicationNumber ?? ''} ${selected.title}`
              : 'Meginmál borið saman við birta auglýsingu'}
          </Text>
        </Stack>
        <Button onClick={closeModal} icon="close" circle iconType="outline" />
      </Inline>
      {selected ? (
        <CompareView advert={selected} onBack={() => setSelected(null)} />
      ) : (
        <AdvertSearch onSelect={setSelected} />
      )}
    </Box>
  )
}

const AdvertSearch = ({
  onSelect,
}: {
  onSelect: (advert: SelectedAdvert) => void
}) => {
  const trpc = useTRPC()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timeout = setTimeout(
      () => setSearch(query.trim()),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timeout)
  }, [query])

  const { data, isFetching, error } = useQuery({
    ...trpc.searchPublishedAdverts.queryOptions({ search }),
    enabled: search.length > 0,
  })

  return (
    <>
      <Input
        name="advert-compare-search"
        label="Leita að birtri auglýsingu"
        placeholder="T.d. 1053/2026 eða heiti auglýsingar"
        size="sm"
        backgroundColor="blue"
        icon={{ name: 'search', type: 'outline' }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <Box className={styles.results}>
        {error ? (
          <AlertMessage
            type="error"
            title="Ekki tókst að leita"
            message="Villa kom upp við leit að auglýsingum. Reyndu aftur síðar."
          />
        ) : isFetching ? (
          <SkeletonLoader repeat={3} height={64} space={1} />
        ) : search && data?.length === 0 ? (
          <Text>Engin birt auglýsing fannst.</Text>
        ) : (
          <Stack space={1}>
            {data?.map((advert) => (
              <FocusableBox
                key={advert.id}
                component="button"
                type="button"
                className={styles.resultButton}
                onClick={() =>
                  onSelect({
                    id: advert.id,
                    title: advert.title,
                    publicationNumber: advert.publicationNumber,
                  })
                }
                border="standard"
                borderRadius="large"
                padding={2}
                background="white"
              >
                <Stack space={0}>
                  <Text variant="eyebrow" color="purple400">
                    {[
                      advert.publicationNumber,
                      advert.department,
                      advert.publicationDate
                        ? formatDate(advert.publicationDate, 'd. MMMM yyyy')
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  <Text variant="h5">{advert.type}</Text>
                  <Text>{advert.title}</Text>
                </Stack>
              </FocusableBox>
            ))}
          </Stack>
        )}
      </Box>
    </>
  )
}

const CompareView = ({
  advert,
  onBack,
}: {
  advert: SelectedAdvert
  onBack: () => void
}) => {
  const trpc = useTRPC()
  const { currentCase } = useCaseContext()
  const [view, setView] = useState<'diff' | 'published'>('diff')
  const [diffHtml, setDiffHtml] = useState<HTMLText | null>(null)
  const [diffFailed, setDiffFailed] = useState(false)

  const { data, error } = useQuery(
    trpc.getAdvert.queryOptions({ id: advert.id }),
  )
  // undefined while loading; null when the advert has no HTML body (some
  // legacy adverts were published as PDF only).
  const publishedHtml = data ? data.advert.document.html : undefined

  useEffect(() => {
    if (!publishedHtml) return

    let cancelled = false
    // Both the differ and the sanitizer are loaded on demand, as in
    // OriginalCompare — neither is needed until a comparison is asked for.
    const computeDiff = async () => {
      const [{ default: getStructuredDiff }, { simpleSanitize }] =
        await Promise.all([
          import('@dmr.is/regulations-tools/structuredDiff-browser'),
          import('@dmr.is/utils-server/cleanLegacyHtml'),
        ])
      const { diff } = getStructuredDiff(
        simpleSanitize(publishedHtml) as HTMLText,
        simpleSanitize(currentCase.html) as HTMLText,
      )
      if (!cancelled) setDiffHtml(diff)
    }

    setDiffHtml(null)
    setDiffFailed(false)
    computeDiff().catch((e) => {
      if (cancelled) return
      logger.error('Failed to compute advert comparison', {
        caseId: currentCase.id,
        advertId: advert.id,
        error: e instanceof Error ? e.message : String(e),
      })
      setDiffFailed(true)
    })

    return () => {
      cancelled = true
    }
  }, [publishedHtml, currentCase.html, currentCase.id, advert.id])

  const diffShowing = view === 'diff'

  const renderBody = () => {
    if (error) {
      return (
        <AlertMessage
          type="error"
          title="Ekki tókst að sækja auglýsingu"
          message="Villa kom upp við að sækja birtu auglýsinguna. Reyndu aftur síðar."
        />
      )
    }
    if (publishedHtml === undefined) {
      return <SkeletonLoader repeat={4} height={24} space={2} />
    }
    if (!publishedHtml) {
      return (
        <AlertMessage
          type="info"
          title="Enginn texti til samanburðar"
          message="Birta auglýsingin hefur ekkert meginmál, hún var líklega aðeins birt sem PDF."
        />
      )
    }
    if (!diffShowing) {
      return (
        <HTMLDump
          className={styles.bodyText}
          html={publishedHtml as HTMLText}
        />
      )
    }
    if (diffFailed) {
      return (
        <AlertMessage
          type="error"
          title="Ekki tókst að reikna breytingar"
          message="Villa kom upp við samanburð á texta. Veldu „Sjá birtan texta“ eða reyndu aftur síðar."
        />
      )
    }
    if (diffHtml === null) {
      return <SkeletonLoader repeat={4} height={24} space={2} />
    }
    return <HTMLDump className={styles.bodyText} html={diffHtml} />
  }

  return (
    <>
      <Inline space={2} alignY="center">
        <Button
          variant="text"
          size="small"
          preTextIcon="arrowBack"
          preTextIconType="outline"
          onClick={onBack}
        >
          Velja aðra auglýsingu
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => setView(diffShowing ? 'published' : 'diff')}
        >
          {diffShowing ? 'Sjá birtan texta' : 'Sjá breytingar'}
        </Button>
      </Inline>
      <Box
        className={styles.content}
        border="standard"
        borderColor="purple200"
        borderRadius="large"
        padding={[2, 3, 4]}
        background="white"
      >
        {renderBody()}
      </Box>
    </>
  )
}

export default AdvertCompare
