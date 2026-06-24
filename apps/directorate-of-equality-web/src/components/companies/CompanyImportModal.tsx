'use client'

import { useRef, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import type {
  CompanyImportResultDto,
  CompanyImportRowResultDto,
} from '../../gen/fetch/types.gen'
import { companiesText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const t = companiesText.importModal

// Row-result sections, in the order shown. `invalid` is rendered separately.
const ROW_SECTIONS: {
  key: keyof Pick<
    CompanyImportResultDto,
    'created' | 'updated' | 'reactivated' | 'deactivated' | 'unchanged'
  >
  label: string
}[] = [
  { key: 'created', label: t.sections.created },
  { key: 'updated', label: t.sections.updated },
  { key: 'reactivated', label: t.sections.reactivated },
  { key: 'deactivated', label: t.sections.deactivated },
  { key: 'unchanged', label: t.sections.unchanged },
]

const RowItem = ({ row }: { row: CompanyImportRowResultDto }) => (
  <Box paddingY="smallGutter">
    <Text variant="small" fontWeight="semiBold">
      {row.name}{' '}
      <Text variant="small" as="span" color="dark300">
        {formatNationalId(row.nationalId)}
      </Text>
    </Text>
    {row.changedFields.map((c, i) => (
      <Text key={i} variant="small" color="dark400">
        {c.field}: {c.from ?? '—'} → {c.to ?? '—'}
      </Text>
    ))}
    {row.note && (
      <Text variant="small" color="yellow600">
        {row.note}
      </Text>
    )}
  </Box>
)

export const CompanyImportModal = ({ isOpen, onClose }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState<string | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [result, setResult] = useState<CompanyImportResultDto | null>(null)

  const previewMutation = useMutation({
    ...trpc.company.importPreview.mutationOptions(),
    onSuccess: (res) => setResult(res),
    onError: () => toast.error(t.errorToast),
  })

  const applyMutation = useMutation({
    ...trpc.company.importApply.mutationOptions(),
    onSuccess: (res) => {
      setResult(res)
      queryClient.invalidateQueries({ queryKey: trpc.company.list.queryKey() })
      toast.success(t.successToast)
    },
    onError: () => toast.error(t.errorToast),
  })

  const reset = () => {
    setFileName(null)
    setFileBase64(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setFileBase64(base64)
      previewMutation.mutate({ file: base64 })
    }
    reader.readAsDataURL(file)
  }

  const committed = !!result?.committed
  const isLoading = previewMutation.isPending

  return (
    <Modal
      baseId="company-import-modal"
      isVisible={isOpen}
      title={t.title}
      onVisibilityChange={(visible) => {
        if (!visible) handleClose()
      }}
      toggleClose={handleClose}
      width="large"
    >
      <Stack space={3}>
        <Text variant="small">{t.description}</Text>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <Inline space={2} alignY="center">
          <Button
            variant="ghost"
            size="small"
            icon="documents"
            iconType="outline"
            loading={isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            {result ? t.chooseAnother : t.chooseFile}
          </Button>
          {fileName && (
            <Text variant="small" color="dark300">
              {fileName}
            </Text>
          )}
        </Inline>

        {result && (
          <Stack space={3}>
            {committed && (
              <Box background="blue100" padding={2} borderRadius="large">
                <Text variant="small" fontWeight="semiBold" color="blue600">
                  {t.committedBanner}
                </Text>
              </Box>
            )}

            <Inline space={2}>
              {result.year != null && (
                <Text variant="small" color="dark400">
                  {t.yearLabel}: {result.year}
                </Text>
              )}
              {result.noticeCount > 0 && (
                <Text variant="small" color="yellow600">
                  {result.noticeCount} {t.noticeCount}
                </Text>
              )}
            </Inline>

            <ImportSummary result={result} />

            {ROW_SECTIONS.map(({ key, label }) => {
              const rows = result[key]
              if (!rows.length) return null
              return (
                <Box key={key}>
                  <Text variant="eyebrow" color="dark400">
                    {label} ({rows.length})
                  </Text>
                  <Box
                    background="dark100"
                    padding={2}
                    borderRadius="large"
                    marginTop={1}
                  >
                    {rows.map((row) => (
                      <RowItem key={row.nationalId} row={row} />
                    ))}
                  </Box>
                </Box>
              )
            })}

            {result.invalid.length > 0 && (
              <Box>
                <Text variant="eyebrow" color="red600">
                  {t.sections.invalid} ({result.invalid.length})
                </Text>
                <Box
                  background="red100"
                  padding={2}
                  borderRadius="large"
                  marginTop={1}
                >
                  {result.invalid.map((err, i) => (
                    <Text key={i} variant="small" color="red600">
                      {t.rowPrefix} {err.row}
                      {err.nationalId
                        ? ` (${formatNationalId(err.nationalId)})`
                        : ''}
                      : {err.reason}
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        )}

        <Inline justifyContent="flexEnd" space={2}>
          <Button variant="ghost" size="small" onClick={handleClose}>
            {committed ? t.close : t.cancel}
          </Button>
          {result && !committed && (
            <Button
              size="small"
              loading={applyMutation.isPending}
              onClick={() => fileBase64 && applyMutation.mutate({ file: fileBase64 })}
            >
              {t.confirm}
            </Button>
          )}
        </Inline>
      </Stack>
    </Modal>
  )
}

const ImportSummary = ({ result }: { result: CompanyImportResultDto }) => (
  <Inline space={2}>
    <Summary label={companiesText.importModal.sections.created} n={result.created.length} />
    <Summary label={companiesText.importModal.sections.updated} n={result.updated.length} />
    <Summary
      label={companiesText.importModal.sections.reactivated}
      n={result.reactivated.length}
    />
    <Summary
      label={companiesText.importModal.sections.deactivated}
      n={result.deactivated.length}
    />
    <Summary
      label={companiesText.importModal.sections.unchanged}
      n={result.unchanged.length}
    />
    <Summary label={companiesText.importModal.sections.invalid} n={result.invalid.length} />
  </Inline>
)

const Summary = ({ label, n }: { label: string; n: number }) => (
  <Box background="dark100" paddingX={2} paddingY={1} borderRadius="large">
    <Text variant="small" fontWeight="semiBold">
      {n}
    </Text>
    <Text variant="eyebrow" color="dark300">
      {label}
    </Text>
  </Box>
)
