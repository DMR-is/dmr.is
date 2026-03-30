import { useCallback, useMemo } from 'react'

import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/utils/toast'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { OJOISelect } from '../select/OJOISelect'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  toggle: boolean
  onToggle: () => void
}

const regulationTypeLabels: Record<string, string> = {
  base: 'Stofnreglugerð',
  amending: 'Breytingareglugerð',
}

export const RegulationMetadataFields = ({
  toggle: expanded,
  onToggle,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { currentCase, canEdit } = useCaseContext()

  const hasRegulationDraft = !!currentCase.regulationDraftId

  const {
    data: draft,
    isLoading,
    error,
  } = useQuery({
    ...trpc.getRegulationDraft.queryOptions({
      caseId: currentCase.id,
    }),
    enabled: hasRegulationDraft,
    refetchOnWindowFocus: false,
  })

  const invalidateDraft = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: trpc.getRegulationDraft.queryKey({ caseId: currentCase.id }),
    })
  }, [queryClient, trpc, currentCase.id])

  const { data: allLawChapters = [] } = useQuery({
    ...trpc.getLawChapters.queryOptions(),
    staleTime: 1000 * 60 * 60, // 1 hour — law chapters rarely change
  })

  const currentSlugs = useMemo(
    () => new Set(draft?.lawChapters?.map((c) => c.slug) ?? []),
    [draft?.lawChapters],
  )

  const lawChapterNameBySlug = useMemo(
    () =>
      allLawChapters.reduce<Record<string, string>>((acc, chapter) => {
        acc[chapter.slug] = chapter.name
        return acc
      }, {}),
    [allLawChapters],
  )

  const lawChapterOptions = useMemo(
    () =>
      allLawChapters
        .filter((c) => !currentSlugs.has(c.slug))
        .map((c) => ({ label: `${c.slug} — ${c.name}`, value: c.slug })),
    [allLawChapters, currentSlugs],
  )

  const updateDraftMutation = useMutation(
    trpc.updateRegulationDraft.mutationOptions({
      onSuccess: () => {
        toast.success('Reglugerðarupplýsingar uppfærðar')
        invalidateDraft()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra reglugerðarupplýsingar')
      },
    }),
  )

  const submitDraftUpdate = useCallback(
    (partial: Record<string, unknown>) => {
      if (!draft) return
      updateDraftMutation.mutate({
        caseId: currentCase.id,
        draftingStatus: draft.draftingStatus,
        title: (partial.title as string) ?? draft.title,
        text: draft.text,
        draftingNotes:
          (partial.draftingNotes as string) ?? draft.draftingNotes ?? '',
        name: draft.name,
        ministry: (partial.ministry as string) ?? draft.ministry,
        effectiveDate: (partial.effectiveDate as string) ?? draft.effectiveDate,
        signatureDate: (partial.signatureDate as string) ?? draft.signatureDate,
        idealPublishDate:
          (partial.idealPublishDate as string) ?? draft.idealPublishDate,
        fastTrack: (partial.fastTrack as boolean) ?? draft.fastTrack,
        lawChapters: draft.lawChapters?.map((c) => c.slug),
        ...partial,
      })
    },
    [draft, currentCase.id, updateDraftMutation],
  )

  return (
    <AccordionItem
      id="regulationMetadataFields"
      expanded={expanded}
      onToggle={onToggle}
      label="Reglugerð - upplýsingar"
      labelVariant="h5"
      iconVariant="small"
    >
      {!hasRegulationDraft && (
        <AlertMessage
          type="info"
          title="Engin reglugerð tengd"
          message="Ekkert reglugerðardrög er tengt þessu máli"
        />
      )}

      {isLoading && (
        <Stack space={2}>
          <SkeletonLoader height={24} borderRadius="large" />
          <SkeletonLoader height={24} borderRadius="large" />
          <SkeletonLoader height={24} borderRadius="large" />
        </Stack>
      )}

      {error && (
        <AlertMessage
          type="error"
          title="Villa"
          message="Ekki tókst að sækja upplýsingar um reglugerð"
        />
      )}

      {draft && (
        <Stack space={3}>
          <FieldRow
            label="Tegund"
            value={regulationTypeLabels[draft.type] ?? draft.type}
          />

          {draft.name && <FieldRow label="Númer" value={draft.name} />}

          <Inline alignY="center" space={[2, 4]}>
            {draft.effectiveDate && (
              <DatePicker
                disabled={!canEdit}
                locale="is"
                size="sm"
                backgroundColor="blue"
                selected={new Date(draft.effectiveDate)}
                label="Gildistökudagur"
                placeholderText=""
                handleChange={(date) => {
                  submitDraftUpdate({
                    effectiveDate: date.toISOString().split('T')[0],
                  })
                }}
              />
            )}

            {draft.idealPublishDate && (
              <DatePicker
                disabled={!canEdit}
                locale="is"
                size="sm"
                backgroundColor="blue"
                selected={new Date(draft.idealPublishDate)}
                label="Æskilegur birtingardagur"
                placeholderText=""
                handleChange={(date) => {
                  submitDraftUpdate({
                    idealPublishDate: date.toISOString().split('T')[0],
                  })
                }}
              />
            )}
          </Inline>

          <Box>
            <Text variant="small" fontWeight="semiBold" marginBottom={1}>
              Lagakaflar
            </Text>
            {draft.lawChapters && draft.lawChapters.length > 0 && (
              <Box marginBottom={2}>
                <Inline space={1} flexWrap="wrap">
                  {draft.lawChapters.map((chapter) => (
                    <Tag key={chapter.slug} variant="blue" outlined>
                      {lawChapterNameBySlug[chapter.slug] ?? chapter.name ?? chapter.slug}
                      {canEdit && (
                        <Box
                          component="button"
                          marginLeft={1}
                          cursor="pointer"
                          background="transparent"
                          padding={0}
                          style={{
                            border: 'none',
                            lineHeight: 1,
                            fontSize: '0.85em',
                          }}
                          onClick={() => {
                            const updated = draft.lawChapters
                              ?.filter((c) => c.slug !== chapter.slug)
                              .map((c) => c.slug)
                            submitDraftUpdate({ lawChapters: updated ?? [] })
                          }}
                        >
                          ✕
                        </Box>
                      )}
                    </Tag>
                  ))}
                </Inline>
              </Box>
            )}
            {canEdit && (
              <OJOISelect
                name="law-chapter-select"
                label="Bæta við lagakafla"
                placeholder="Leita að lagakafla..."
                options={lawChapterOptions}
                value={null}
                onChange={(opt) => {
                  if (!opt) return
                  const currentChapterSlugs =
                    draft.lawChapters?.map((c) => c.slug) ?? []
                  submitDraftUpdate({
                    lawChapters: [...currentChapterSlugs, opt.value as string],
                  })
                }}
              />
            )}
          </Box>

          {draft.signedDocumentUrl && (
            <Box>
              <Text variant="small" fontWeight="semiBold">
                Undirritað skjal
              </Text>
              <Box marginTop={1}>
                <a
                  href={draft.signedDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Text color="blue400" variant="small">
                    Opna undirritað skjal
                  </Text>
                </a>
              </Box>
            </Box>
          )}
        </Stack>
      )}
    </AccordionItem>
  )
}

const FieldRow = ({ label, value }: { label: string; value: string }) => (
  <Inline space={2} alignY="center">
    <Text variant="small" fontWeight="semiBold">
      {label}:
    </Text>
    <Text variant="small">{value}</Text>
  </Inline>
)
