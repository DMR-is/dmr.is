import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { HTMLText } from '@dmr.is/regulations-tools/types'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { ModalBase } from '@dmr.is/ui/components/island-is/ModalBase'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/utils/toast'

import { RegulationImpact } from '../../gen/fetch'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { useFileUploader } from '../../lib/utils'
import { HTMLEditor } from '../editor/Editor'
import { OJOIInput } from '../select/OJOIInput'
import * as styles from './EditChangeModal.css'

import { useMutation } from '@tanstack/react-query'

const DynamicHTMLDump = dynamic(
  () => import('@dmr.is/regulations-tools/html').then((m) => m.HTMLDump),
  { ssr: false },
)

type Props = {
  visible: boolean
  onClose: () => void
  caseId: string
  impact?: RegulationImpact
  onSuccess: () => void
}

export const EditChangeModal = ({
  visible,
  onClose,
  caseId,
  impact,
  onSuccess,
}: Props) => {
  const trpc = useTRPC()
  const { data: session } = useSession()
  const { currentCase } = useCaseContext()
  const isEdit = !!impact

  const [regulation, setRegulation] = useState(impact?.regulation ?? '')
  const [date, setDate] = useState(impact?.date ?? '')
  const [title, setTitle] = useState(impact?.title ?? '')

  // Track the current editor text via ref (editor uses valueRef pattern)
  const currentTextRef = useRef<string>(impact?.text ?? '')

  // Diff HTML — computed against the original published regulation text
  const [diffHtml, setDiffHtml] = useState<HTMLText | null>(
    (impact?.diff as HTMLText) ?? null,
  )

  // Reset state when impact changes (since no key prop to force remount)
  const impactId = impact?.id
  useEffect(() => {
    setRegulation(impact?.regulation ?? '')
    setDate(impact?.date ?? '')
    setTitle(impact?.title ?? '')
    currentTextRef.current = impact?.text ?? ''
    setDiffHtml((impact?.diff as HTMLText) ?? null)
    originalRegulationRef.current = null
  }, [impactId])

  // Fetch the original published regulation text for diff computation
  const originalRegulationRef = useRef<{ title: string; text: string } | null>(
    null,
  )
  const regulationName = isEdit ? impact.regulation : regulation

  useEffect(() => {
    if (!visible || !regulationName) return
    // Already fetched for this regulation
    if (originalRegulationRef.current) return

    const controller = new AbortController()
    const fetchText = async () => {
      try {
        const res = await fetch(
          `/api/trpc/getPublicRegulationText?input=${encodeURIComponent(
            JSON.stringify({ regulation: regulationName }),
          )}`,
          { signal: controller.signal },
        )
        if (!res.ok) return
        const json = await res.json()
        const data = json?.result?.data
        if (data?.text) {
          originalRegulationRef.current = data
        }
      } catch {
        // Ignore abort errors
      }
    }
    fetchText()
    return () => controller.abort()
  }, [visible, regulationName])

  // Recompute diff against the original published regulation text
  const recomputeDiff = useCallback(async (editorText: string) => {
    const originalText = originalRegulationRef.current?.text
    if (!originalText || !editorText) {
      setDiffHtml(null)
      return
    }
    const [{ default: dirtyClean }, { getDiff }] = await Promise.all([
      import('@dmr.is/regulations-tools/dirtyClean-browser'),
      import('@dmr.is/regulations-tools/html'),
    ])
    const result = getDiff(
      dirtyClean(originalText as HTMLText),
      dirtyClean(editorText as HTMLText),
    )
    setDiffHtml(result.diff)
  }, [])

  const fileUploader = useFileUploader(
    currentCase.applicationId ?? 'no-application-id',
    caseId,
    session?.idToken as string,
  )

  const createMutation = useMutation(
    trpc.createRegulationChange.mutationOptions({
      onSuccess: () => {
        toast.success('Breytingu bætt við')
        onSuccess()
        onClose()
      },
      onError: () => {
        toast.error('Ekki tókst að bæta við breytingu')
      },
    }),
  )

  const updateMutation = useMutation(
    trpc.updateRegulationChange.mutationOptions({
      onSuccess: () => {
        toast.success('Breyting uppfærð')
        onSuccess()
        onClose()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra breytingu')
      },
    }),
  )

  const isPending = createMutation.isPending || updateMutation.isPending
  const canSubmit = regulation && date && title

  const handleSave = async () => {
    const text = currentTextRef.current
    if (!regulation || !date || !title || !text) return

    // Compute diff against original published regulation text
    let diff: string | undefined
    const originalText = originalRegulationRef.current?.text
    if (originalText && text) {
      const [{ default: dirtyClean }, { getDiff }] = await Promise.all([
        import('@dmr.is/regulations-tools/dirtyClean-browser'),
        import('@dmr.is/regulations-tools/html'),
      ])
      const result = getDiff(
        dirtyClean(originalText as HTMLText),
        dirtyClean(text as HTMLText),
      )
      diff = result.diff as string
    } else {
      diff = diffHtml as string | undefined
    }

    if (isEdit) {
      updateMutation.mutate({
        caseId,
        changeId: impact.id,
        date,
        title,
        text,
        diff,
      })
    } else {
      createMutation.mutate({
        caseId,
        regulation,
        date,
        title,
        text,
        diff,
      })
    }
  }

  if (!visible) return null

  return (
    <ModalBase
      baseId="edit-change-modal"
      initialVisibility={true}
      onVisibilityChange={(v) => {
        if (!v) onClose()
      }}
      className={styles.layoverModal}
      hideOnClickOutside={false}
      hideOnEsc
    >
      {({ closeModal }) => (
        <>
          {/* Header */}
          <div className={styles.modalHeader}>
            <Text variant="h3">
              {isEdit ? 'Breyta textabreytingu' : 'Ný textabreyting'}
            </Text>
            <Inline space={2} alignY="center">
              <Text variant="medium">Loka glugga</Text>
              <Button
                colorScheme="light"
                circle
                icon="close"
                iconType="outline"
                onClick={() => {
                  closeModal()
                  onClose()
                }}
              />
            </Inline>
          </div>

          {/* Content */}
          <div className={styles.modalContent}>
            <Stack space={3}>
              <OJOIInput
                name="change-title"
                label="Titill breytingar"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Inline space={3} alignY="bottom">
                <Box style={{ flex: 1 }}>
                  <OJOIInput
                    name="change-regulation"
                    label="Reglugerð (t.d. 0665/2020)"
                    value={regulation}
                    disabled={isEdit}
                    onChange={(e) => setRegulation(e.target.value)}
                  />
                </Box>
                <Box>
                  <DatePicker
                    locale="is"
                    size="sm"
                    backgroundColor="blue"
                    selected={date ? new Date(date) : undefined}
                    label="Gildistökudagur"
                    placeholderText="Veldu dagsetningu"
                    handleChange={(d) => {
                      setDate(d.toISOString().split('T')[0])
                    }}
                  />
                </Box>
              </Inline>

              <Box>
                <Text variant="small" fontWeight="semiBold" marginBottom={1}>
                  Texti breytingar
                </Text>
                <Box
                  borderColor="blue200"
                  border="standard"
                  borderRadius="large"
                >
                  <HTMLEditor
                    key={impact?.id ?? 'new'}
                    defaultValue={(impact?.text ?? '') as HTMLText}
                    onChange={(val) => {
                      currentTextRef.current = val as string
                    }}
                    onBlur={() => {
                      recomputeDiff(currentTextRef.current)
                    }}
                    handleUpload={fileUploader()}
                  />
                </Box>
              </Box>

              <Inline space={2} justifyContent="flexEnd">
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => {
                    closeModal()
                    onClose()
                  }}
                >
                  Hætta við
                </Button>
                <Button
                  size="small"
                  onClick={handleSave}
                  disabled={!canSubmit}
                  loading={isPending}
                >
                  Vista
                </Button>
              </Inline>
            </Stack>
          </div>

          {/* Slide-in diff reference panel (right side) */}
          {diffHtml && (
            <div className={styles.referenceTextContainer}>
              <div className={styles.referenceText}>
                <h2 className={styles.referenceTextLegend}>
                  Breytingar (diff)
                </h2>
                <div className={styles.referenceTextInner}>
                  {title && (
                    <h3 className={styles.referenceTextTitle}>{title}</h3>
                  )}
                  <DynamicHTMLDump
                    className={styles.referenceTextBody}
                    html={diffHtml}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </ModalBase>
  )
}
