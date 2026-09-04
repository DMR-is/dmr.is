'use client'

import { useRef, useState } from 'react'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Drawer } from '@dmr.is/ui/components/island-is/Drawer'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { GenderEnum } from '../../gen/fetch/types.gen'
import { overviewText, reportText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId, parseInflightConflictStatus } from '../../lib/utils'
import { UtilityButton } from '../buttons/UtilityButton'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const t = overviewText.createEqualityReport
const s = sharedText

const GENDER_OPTIONS = [
  { label: s.genders.male, value: GenderEnum.MALE },
  { label: s.genders.female, value: GenderEnum.FEMALE },
  { label: s.genders.neutral, value: GenderEnum.NEUTRAL },
]

const EMPTY_FORM = {
  companyAdminName: '',
  companyAdminTitle: '',
  companyAdminEmail: '',
  companyAdminGender: GenderEnum.MALE,
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
  equalityReportContent: '',
  averageEmployeeMaleCount: '',
  averageEmployeeFemaleCount: '',
  averageEmployeeNeutralCount: '',
}

/**
 * Mirrors the API's 4MB cap on a decoded PDF.
 *
 * Checked here as well as server-side because the failure is much cheaper to
 * explain before the upload than after: base64 inflates by 4/3, so an oversized
 * file would otherwise be encoded, sent, and rejected — for a limit the admin
 * could have been told about on selection.
 */
const MAX_PDF_BYTES = 4 * 1024 * 1024

/** Which representation the admin is entering the content as. */
type ContentMode = 'TEXT' | 'PDF'

type SelectedPdf = { filename: string; base64: string }

/**
 * Reads a File into base64 without the data-URI prefix `readAsDataURL` adds.
 *
 * Chunked rather than `String.fromCharCode(...bytes)`: spreading a multi-megabyte
 * array into an argument list overflows the call stack, and 4MB is comfortably
 * past where that starts failing.
 */
const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const CHUNK = 0x8000
  let binary = ''

  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }

  return btoa(binary)
}

export const CreateEqualityReportDrawer = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isOpen, setIsOpen] = useState<boolean | undefined>(undefined)
  const [contentMode, setContentMode] = useState<ContentMode>('TEXT')
  const [pdf, setPdf] = useState<SelectedPdf | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const editorKey = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handlePdfChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    // Clear the input so re-picking the same file after an error still fires
    // `change` — otherwise a corrected upload of the same name does nothing.
    event.target.value = ''

    if (!file) return

    setPdfError(null)

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setPdf(null)
      setPdfError(t.pdfNotAPdf)
      return
    }

    if (file.size > MAX_PDF_BYTES) {
      setPdf(null)
      setPdfError(t.pdfTooLarge)
      return
    }

    try {
      setPdf({ filename: file.name, base64: await fileToBase64(file) })
    } catch {
      setPdf(null)
      setPdfError(t.pdfReadError)
    }
  }

  const companiesQuery = useQuery(
    trpc.company.list.queryOptions({ pageSize: 1000 }),
  )

  const companyOptions = (companiesQuery.data?.companies ?? []).map((c) => ({
    label: `${c.name} (${formatNationalId(c.nationalId)})`,
    value: c.id,
  }))

  const submitMutation = useMutation({
    ...trpc.adminReport.submitEquality.mutationOptions(),
    onSuccess: () => {
      toast.success(t.successToast)
      queryClient.invalidateQueries({ queryKey: trpc.reports.list.queryKey() })
      handleReset()
      setIsOpen(false)
    },
    onError: (error) => {
      // The API blocks a new submit while a sibling report is IN_REVIEW or
      // POSTPONED (409). Tell the admin which status is blocking instead of
      // the generic fallback so they know to resolve the in-flight report.
      const conflictStatus = parseInflightConflictStatus(error.message)
      if (conflictStatus) {
        toast.error(t.inflightConflictToast.replace('{status}', conflictStatus))
        return
      }
      toast.error(s.form.errorToast)
    },
  })

  const handleReset = () => {
    setForm(EMPTY_FORM)
    setCompanyId(null)
    setContentMode('TEXT')
    setPdf(null)
    setPdfError(null)
    editorKey.current += 1
  }

  const isPdfMode = contentMode === 'PDF'

  const handleSubmit = () => {
    if (!companyId) return
    submitMutation.mutate({
      path: { companyId },
      body: {
        providerType: 'SYSTEM',
        providerId: Math.random().toString(36).substring(2, 15), // random ID to avoid replay, see report-create.service.ts
        companyAdminName: form.companyAdminName,
        companyAdminTitle: form.companyAdminTitle || null,
        companyAdminEmail: form.companyAdminEmail,
        companyAdminGender: form.companyAdminGender,
        contactName: form.contactName,
        contactTitle: form.contactTitle || null,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        // Exactly one of the two — the API rejects both together, and sending
        // the unused one as an empty string would count as "both supplied".
        ...(isPdfMode
          ? {
              equalityReportPdf: pdf?.base64,
              equalityReportPdfFilename: pdf?.filename,
            }
          : { equalityReportContent: form.equalityReportContent }),
        averageEmployeeMaleCount: form.averageEmployeeMaleCount
          ? Number(form.averageEmployeeMaleCount)
          : undefined,
        averageEmployeeFemaleCount: form.averageEmployeeFemaleCount
          ? Number(form.averageEmployeeFemaleCount)
          : undefined,
        averageEmployeeNeutralCount: form.averageEmployeeNeutralCount
          ? Number(form.averageEmployeeNeutralCount)
          : undefined,
      },
    })
  }

  const canSubmit =
    !!companyId &&
    !!form.companyAdminName &&
    !!form.companyAdminEmail &&
    !!form.contactName &&
    !!form.contactEmail &&
    !!form.contactPhone &&
    // Whichever representation is active has to actually carry content.
    (isPdfMode ? !!pdf : !!form.equalityReportContent)

  return (
    <Drawer
      ariaLabel={t.drawerLabel}
      baseId="create-equality-report-drawer"
      isVisible={isOpen}
      onVisibilityChange={setIsOpen}
      disclosure={
        <UtilityButton icon="add" fluid>
          {t.buttonLabel}
        </UtilityButton>
      }
    >
      <GridContainer>
        <Text variant="h2" marginBottom={6}>
          {t.heading}
        </Text>
        <GridRow rowGap={1} marginBottom={4}>
          <GridColumn span="12/12">
            <Text variant="h4" marginBottom={1}>
              {s.form.companyHeading}
            </Text>
          </GridColumn>
          <GridColumn span={['12/12', '8/12']}>
            <Select
              name="company"
              label={s.form.companySelect}
              options={companyOptions}
              value={companyOptions.find((o) => o.value === companyId) ?? null}
              onChange={(opt) => setCompanyId(opt?.value ?? null)}
              isLoading={companiesQuery.isLoading}
              size="xs"
              backgroundColor="blue"
            />
          </GridColumn>
        </GridRow>

        <GridRow rowGap={1} marginBottom={4}>
          <GridColumn span="12/12">
            <Text variant="h4" marginBottom={1}>
              {s.form.topManagerHeading}
            </Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <TextInput
              name="companyAdminName"
              label={s.form.nameLabel}
              size="xs"
              value={form.companyAdminName}
              onChange={(e) => set('companyAdminName')(e.target.value)}
              disabled={!companyId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <TextInput
              name="companyAdminTitle"
              label={s.form.jobTitleLabel}
              size="xs"
              value={form.companyAdminTitle}
              onChange={(e) => set('companyAdminTitle')(e.target.value)}
              disabled={!companyId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <TextInput
              name="companyAdminEmail"
              label={s.form.emailLabel}
              type="email"
              size="xs"
              value={form.companyAdminEmail}
              onChange={(e) => set('companyAdminEmail')(e.target.value)}
              disabled={!companyId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Select
              name="companyAdminGender"
              label={s.form.genderLabel}
              options={GENDER_OPTIONS}
              value={GENDER_OPTIONS.find(
                (o) => o.value === form.companyAdminGender,
              )}
              onChange={(opt) => opt && set('companyAdminGender')(opt.value)}
              size="xs"
              backgroundColor="blue"
            />
          </GridColumn>
        </GridRow>

        <GridRow rowGap={1} marginBottom={4}>
          <GridColumn span="12/12">
            <Text variant="h4" marginBottom={1}>
              {s.form.contactHeading}
            </Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <TextInput
              name="contactName"
              label={s.form.nameLabel}
              size="xs"
              value={form.contactName}
              onChange={(e) => set('contactName')(e.target.value)}
              disabled={!companyId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <TextInput
              name="contactTitle"
              label={s.form.jobTitleLabel}
              size="xs"
              value={form.contactTitle}
              onChange={(e) => set('contactTitle')(e.target.value)}
              disabled={!companyId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <TextInput
              name="contactEmail"
              label={s.form.emailLabel}
              type="email"
              size="xs"
              value={form.contactEmail}
              onChange={(e) => set('contactEmail')(e.target.value)}
              disabled={!companyId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <TextInput
              name="contactPhone"
              label={s.form.phoneLabel}
              type="tel"
              size="xs"
              value={form.contactPhone}
              onChange={(e) => set('contactPhone')(e.target.value)}
              disabled={!companyId}
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={1} marginBottom={4}>
          <GridColumn span="12/12">
            <Text variant="h4" marginBottom={1}>
              {t.employeeCountHeading}
            </Text>
          </GridColumn>
          <GridColumn span={['12/12', '4/12']}>
            <TextInput
              name="averageEmployeeMaleCount"
              label={s.genders.maleCount}
              type="number"
              size="xs"
              value={form.averageEmployeeMaleCount}
              onChange={(e) => set('averageEmployeeMaleCount')(e.target.value)}
              disabled={!companyId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '4/12']}>
            <TextInput
              name="averageEmployeeFemaleCount"
              label={s.genders.femaleCount}
              type="number"
              size="xs"
              value={form.averageEmployeeFemaleCount}
              onChange={(e) =>
                set('averageEmployeeFemaleCount')(e.target.value)
              }
              disabled={!companyId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '4/12']}>
            <TextInput
              name="averageEmployeeNeutralCount"
              label={s.genders.neutral}
              type="number"
              size="xs"
              value={form.averageEmployeeNeutralCount}
              onChange={(e) =>
                set('averageEmployeeNeutralCount')(e.target.value)
              }
              disabled={!companyId}
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={1} marginBottom={4}>
          <GridColumn span="12/12">
            <Text variant="h4" marginBottom={1}>
              {reportText.tabsLabel}
            </Text>
          </GridColumn>
          <GridColumn span="12/12">
            <Box marginBottom={2}>
              <Inline space={2}>
                <Button
                  variant={isPdfMode ? 'ghost' : 'primary'}
                  size="small"
                  disabled={!companyId}
                  onClick={() => setContentMode('TEXT')}
                >
                  {t.contentModeText}
                </Button>
                <Button
                  variant={isPdfMode ? 'primary' : 'ghost'}
                  size="small"
                  disabled={!companyId}
                  onClick={() => setContentMode('PDF')}
                >
                  {t.contentModePdf}
                </Button>
              </Inline>
            </Box>
          </GridColumn>
          <GridColumn span="12/12">
            {isPdfMode ? (
              <Box
                background={pdf ? 'mint100' : 'blue100'}
                borderRadius="large"
                padding={3}
                display="flex"
                alignItems="center"
                columnGap={3}
              >
                <Box flexGrow={1}>
                  <Text variant="small">
                    {pdf ? pdf.filename : t.pdfPlaceholder}
                  </Text>
                </Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handlePdfChange}
                  disabled={!companyId}
                />
                <Button
                  variant="ghost"
                  size="small"
                  disabled={!companyId}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {pdf ? t.switchPdf : t.choosePdf}
                </Button>
              </Box>
            ) : (
              <Box
                border="standard"
                position="relative"
                zIndex={10}
                borderRadius="large"
              >
                <HTMLEditor
                  key={editorKey.current}
                  disabled={!companyId}
                  defaultValue={form.equalityReportContent}
                  handleUpload={() => new Error('File upload not supported')}
                  onChange={(value) => set('equalityReportContent')(value)}
                  config={{
                    toolbar:
                      'bold italic underline | align numlist bullist | link',
                  }}
                />
              </Box>
            )}
          </GridColumn>
          {pdfError && isPdfMode && (
            <GridColumn span="12/12">
              <Box marginTop={2}>
                <AlertMessage type="error" message={pdfError} />
              </Box>
            </GridColumn>
          )}
        </GridRow>

        <GridRow rowGap={1} marginBottom={4}>
          <GridColumn span="12/12">
            <Inline justifyContent="flexEnd" space={2}>
              <Button variant="ghost" size="small" onClick={handleReset}>
                {s.form.reset}
              </Button>
              <Button
                size="small"
                disabled={!canSubmit}
                loading={submitMutation.isPending}
                onClick={handleSubmit}
              >
                {s.form.submit}
              </Button>
            </Inline>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Drawer>
  )
}
