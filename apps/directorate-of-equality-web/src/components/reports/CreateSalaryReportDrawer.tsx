'use client'

import { useRef, useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Drawer } from '@dmr.is/ui/components/island-is/Drawer'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import {
  CompanyReportStatusEnum,
  GenderEnum,
  type ParsedReportDto,
  type SalaryAnalysisOutlierDto,
} from '../../gen/fetch/types.gen'
import { putWorkbookToPresignedUrl } from '../../lib/import-upload'
import { overviewText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import {
  formatNationalId,
  formatSalary,
  parseInflightConflictStatus,
} from '../../lib/utils'
import { UtilityButton } from '../buttons/UtilityButton'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'

const OUTLIERS_PAGE_SIZE = 10

const t = overviewText.createSalaryReport
const d = t.deviations
const s = sharedText

const GENDER_OPTIONS = [
  { label: s.genders.male, value: GenderEnum.MALE },
  { label: s.genders.female, value: GenderEnum.FEMALE },
  { label: s.genders.neutral, value: GenderEnum.NEUTRAL },
]

const EMPTY_FORM = {
  companyAdminName: '',
  companyAdminEmail: '',
  companyAdminGender: GenderEnum.MALE,
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  averageEmployeeMaleCount: '',
  averageEmployeeFemaleCount: '',
  averageEmployeeNeutralCount: '',
}

// Local editing shape for an outlier group. `ordinals` holds the detected
// outlier ordinals assigned to this group; every detected outlier must end up
// in exactly one group before the report can be submitted with explanations.
type OutlierGroupForm = {
  id: string
  reason: string
  action: string
  signatureName: string
  signatureRole: string
  ordinals: number[]
}

const makeGroup = (id: string): OutlierGroupForm => ({
  id,
  reason: '',
  action: '',
  signatureName: '',
  signatureRole: '',
  ordinals: [],
})

function parseOutlierOrdinals(message: string): number[] | null {
  const match = message.match(/employee ordinal\(s\): ([\d,\s]+)/)
  if (!match) return null
  return match[1]
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))
}

export const CreateSalaryReportDrawer = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const groupIdCounter = useRef(0)

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [parsedReport, setParsedReport] = useState<ParsedReportDto | null>(null)
  const [outliers, setOutliers] = useState<SalaryAnalysisOutlierDto[]>([])
  const [importErrors, setImportErrors] = useState<string[] | null>(null)
  const [postpone, setPostpone] = useState(false)
  const [postponeReason, setPostponeReason] = useState('')
  const [groups, setGroups] = useState<OutlierGroupForm[]>([])
  const [isOpen, setIsOpen] = useState<boolean | undefined>(undefined)

  const set = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const nextGroup = () => makeGroup(`g${(groupIdCounter.current += 1)}`)

  const companiesQuery = useQuery(
    trpc.company.list.queryOptions({ pageSize: 1000 }),
  )

  const companyOptions = (companiesQuery.data?.companies ?? []).map((c) => ({
    label: `${c.name} (${formatNationalId(c.nationalId)})`,
    value: c.id,
  }))

  // A salary report must reference an approved, in-force equality report. The
  // company's server-computed report status already tells us when one is
  // missing, so we can warn the admin up front rather than let them fill in the
  // whole form and hit a 404 on submit.
  const selectedCompany =
    companiesQuery.data?.companies.find((c) => c.id === companyId) ?? null
  const missingEqualityReport =
    selectedCompany?.reportStatus ===
    CompanyReportStatusEnum.MISSING_EQUALITY_REPORT

  const requestUploadMutation = useMutation(
    trpc.adminReport.requestImportUpload.mutationOptions(),
  )

  const analyzeMutation = useMutation({
    ...trpc.adminReport.analyzeSalary.mutationOptions(),
    onSuccess: (data) => {
      setOutliers(data.outliers)
      // Groups start empty; the admin builds them by selecting rows in the
      // outlier table and clicking "create group".
      setGroups([])
    },
    onError: () => toast.error(d.analyzeError),
  })

  const importMutation = useMutation({
    ...trpc.adminReport.importWorkbook.mutationOptions(),
    onSuccess: (data) => {
      setParsedReport(data)
      setImportErrors(null)
      toast.success(t.excelSuccessToast)
      resetDeviations()
      if (companyId) {
        analyzeMutation.mutate({ path: { companyId }, body: { parsed: data } })
      }
    },
    onError: (error) => {
      // The API sends one formatted line per problem (sheet/row/column +
      // reason) through the tRPC error's `validationErrors`. Surface the full
      // list so the admin can fix the workbook without digging through logs.
      const details = error.data?.validationErrors
      setImportErrors(
        Array.isArray(details) && details.length > 0 ? details : null,
      )
      toast.error(t.excelErrorToast)
    },
  })

  const submitMutation = useMutation(
    trpc.adminReport.submitSalary.mutationOptions(),
  )

  const resetDeviations = () => {
    setOutliers([])
    setGroups([])
    setPostpone(false)
    setPostponeReason('')
    analyzeMutation.reset()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !companyId) return

    setImportErrors(null)

    try {
      // Upload the workbook straight to S3, then hand the object key to the API.
      const { url, key } = await requestUploadMutation.mutateAsync()
      await putWorkbookToPresignedUrl(url, file)
      importMutation.mutate({
        path: { companyId },
        body: { key },
      })
    } catch {
      toast.error(t.excelErrorToast)
    }
  }

  // Downloads the blank Excel template. The API endpoint is bearer-guarded, so
  // we hit a same-origin route that injects the token server-side; the response
  // carries an attachment disposition, so the click triggers a download without
  // navigating away.
  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/api/salary-template'
    link.download = 'salary-report-template.xlsx'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleReset = () => {
    setForm(EMPTY_FORM)
    setCompanyId(null)
    setParsedReport(null)
    resetDeviations()
    setImportErrors(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updateGroup = (id: string, patch: Partial<OutlierGroupForm>) =>
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    )

  const removeGroup = (id: string) =>
    setGroups((prev) => prev.filter((g) => g.id !== id))

  // Turns the currently-selected outlier rows into a new group. Selection only
  // ever holds unassigned ordinals, so every outlier ends up in one group.
  const createGroup = (ordinals: number[]) => {
    if (ordinals.length === 0) return
    setGroups((prev) => [...prev, { ...nextGroup(), ordinals }])
  }

  const identifierForOrdinal = (ordinal: number) =>
    parsedReport?.employees.find((e) => e.ordinal === ordinal)?.identifier ??
    `#${ordinal}`

  // --- Outlier resolution state --------------------------------------------
  const hasOutliers = outliers.length > 0
  const activeGroups = groups.filter((g) => g.ordinals.length > 0)
  const assignedOrdinals = new Set(activeGroups.flatMap((g) => g.ordinals))
  const allOutliersAssigned = outliers.every((o) =>
    assignedOrdinals.has(o.employeeOrdinal),
  )
  const groupsComplete = activeGroups.every(
    (g) =>
      g.reason.trim() &&
      g.action.trim() &&
      g.signatureName.trim() &&
      g.signatureRole.trim(),
  )
  const explanationsValid =
    activeGroups.length > 0 && allOutliersAssigned && groupsComplete

  const outliersResolved =
    !hasOutliers || (postpone ? !!postponeReason.trim() : explanationsValid)

  const handleSubmit = async () => {
    if (!companyId || !parsedReport) return

    const body = {
      importedFromExcel: true,
      providerType: 'SYSTEM' as const,
      providerId: Math.random().toString(36).substring(2, 15), // random ID to avoid replay, see report-create.service.ts
      companyAdminName: form.companyAdminName,
      companyAdminEmail: form.companyAdminEmail,
      companyAdminGender: form.companyAdminGender,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      averageEmployeeMaleCount: Number(form.averageEmployeeMaleCount),
      averageEmployeeFemaleCount: Number(form.averageEmployeeFemaleCount),
      averageEmployeeNeutralCount: Number(form.averageEmployeeNeutralCount),
      parsed: parsedReport,
      postponed: hasOutliers ? postpone : false,
      postponeReason: hasOutliers && postpone ? postponeReason : undefined,
      outlierGroups:
        hasOutliers && !postpone
          ? activeGroups.map((g) => ({
              reason: g.reason,
              action: g.action,
              signatureName: g.signatureName,
              signatureRole: g.signatureRole,
              employeeOrdinals: g.ordinals,
            }))
          : undefined,
    }

    const onSuccess = () => {
      toast.success(t.successToast)
      queryClient.invalidateQueries({ queryKey: trpc.reports.list.queryKey() })
      handleReset()
      setIsOpen(false)
    }

    try {
      await submitMutation.mutateAsync({ path: { companyId }, body })
      onSuccess()
    } catch (firstError) {
      // With the preview in place this path is a safety net for a threshold
      // drift between preview and submit — surface the ordinals if the server
      // still rejects the outlier coverage.
      const message = firstError instanceof Error ? firstError.message : ''
      const ordinals = parseOutlierOrdinals(message)

      if (ordinals && !postpone) {
        toast.error(
          `Frávik fundust fyrir ${ordinals.length} starfsmenn. Yfirfarðu frávikahópana og reyndu aftur.`,
        )
        return
      }

      // Safety net: the proactive gate above normally catches this, but the
      // company's report status may be stale (e.g. an equality report expired
      // since the list was loaded). Surface the API's "no approved equality
      // report" error as a clear message instead of the generic fallback.
      if (/equality report/i.test(message)) {
        toast.error(t.missingEqualityToast)
        return
      }

      // The API blocks a new submit while a sibling report is IN_REVIEW or
      // POSTPONED (409). Tell the admin which status is blocking instead of
      // the generic fallback so they know to resolve the in-flight report.
      const conflictStatus = parseInflightConflictStatus(message)
      if (conflictStatus) {
        toast.error(t.inflightConflictToast.replace('{status}', conflictStatus))
        return
      }

      toast.error(s.form.errorToast)
    }
  }

  const canSubmit =
    !!companyId &&
    !missingEqualityReport &&
    !!parsedReport &&
    analyzeMutation.isSuccess &&
    !!form.companyAdminName &&
    !!form.companyAdminEmail &&
    !!form.contactName &&
    !!form.contactEmail &&
    !!form.contactPhone &&
    !!form.averageEmployeeMaleCount &&
    !!form.averageEmployeeFemaleCount &&
    !!form.averageEmployeeNeutralCount &&
    outliersResolved

  return (
    <Drawer
      ariaLabel={t.drawerLabel}
      baseId="create-salary-report-drawer"
      isVisible={isOpen}
      onVisibilityChange={setIsOpen}
      disclosure={
        <UtilityButton fluid icon="add">
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
              onChange={(opt) => {
                setCompanyId(opt?.value ?? null)
                setParsedReport(null)
                resetDeviations()
                setImportErrors(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              isLoading={companiesQuery.isLoading}
              size="xs"
              backgroundColor="blue"
            />
          </GridColumn>
          {missingEqualityReport && (
            <GridColumn span="12/12">
              <AlertMessage
                type="warning"
                title={t.missingEqualityTitle}
                message={t.missingEqualityMessage}
              />
            </GridColumn>
          )}
        </GridRow>
        <GridRow rowGap={1} marginBottom={4}>
          <GridColumn span="12/12">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="spaceBetween"
              marginBottom={1}
            >
              <Text variant="h4">{t.excelHeading}</Text>
              <Button
                variant="text"
                size="small"
                icon="download"
                iconType="outline"
                onClick={handleDownloadTemplate}
              >
                {t.downloadTemplate}
              </Button>
            </Box>
          </GridColumn>
          <GridColumn span="12/12">
            <Box
              background={parsedReport ? 'mint100' : 'blue100'}
              borderRadius="large"
              padding={3}
              display="flex"
              alignItems="center"
              columnGap={3}
            >
              <Box flexGrow={1}>
                <Text variant="small">
                  {parsedReport
                    ? `Gögn flutt inn: ${parsedReport.employees.length} starfsmenn, ${parsedReport.roles.length} hlutverk, ${parsedReport.criteria.length} viðmið`
                    : t.excelPlaceholder}
                </Text>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={!companyId}
              />
              <Button
                variant="ghost"
                size="small"
                loading={
                  requestUploadMutation.isPending || importMutation.isPending
                }
                disabled={!companyId}
                onClick={() => fileInputRef.current?.click()}
              >
                {parsedReport ? t.switchFile : t.chooseFile}
              </Button>
            </Box>
          </GridColumn>
          {importErrors && (
            <GridColumn span="12/12">
              <AlertMessage
                type="error"
                title={t.excelErrorTitle}
                message={
                  <Box>
                    <Text variant="small" marginBottom={1}>
                      {t.excelErrorIntro}
                    </Text>
                    <ul style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
                      {importErrors.map((err, i) => (
                        <li key={i}>
                          <Text variant="small">{err}</Text>
                        </li>
                      ))}
                    </ul>
                  </Box>
                }
              />
            </GridColumn>
          )}
        </GridRow>

        {parsedReport && (
          <GridRow rowGap={1} marginBottom={4}>
            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {t.deviationsHeading}
              </Text>
            </GridColumn>
            <GridColumn span="12/12">
              {analyzeMutation.isPending ? (
                <Text variant="small">{d.analyzing}</Text>
              ) : analyzeMutation.isError ? (
                <Box
                  background="red100"
                  borderRadius="large"
                  padding={2}
                  display="flex"
                  alignItems="center"
                  columnGap={2}
                >
                  <Box flexGrow={1}>
                    <Text variant="small">{d.analyzeError}</Text>
                  </Box>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() =>
                      companyId &&
                      analyzeMutation.mutate({
                        path: { companyId },
                        body: { parsed: parsedReport },
                      })
                    }
                  >
                    {t.switchFile}
                  </Button>
                </Box>
              ) : !hasOutliers ? (
                <Box background="mint100" borderRadius="large" padding={2}>
                  <Text variant="small">{d.none}</Text>
                </Box>
              ) : (
                <OutlierEditor
                  outliers={outliers}
                  identifierForOrdinal={identifierForOrdinal}
                  postpone={postpone}
                  setPostpone={setPostpone}
                  postponeReason={postponeReason}
                  setPostponeReason={setPostponeReason}
                  groups={groups}
                  createGroup={createGroup}
                  removeGroup={removeGroup}
                  updateGroup={updateGroup}
                  assignedOrdinals={assignedOrdinals}
                  allOutliersAssigned={allOutliersAssigned}
                  groupsComplete={groupsComplete}
                />
              )}
            </GridColumn>
          </GridRow>
        )}

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

type OutlierEditorProps = {
  outliers: SalaryAnalysisOutlierDto[]
  identifierForOrdinal: (ordinal: number) => string
  postpone: boolean
  setPostpone: (v: boolean) => void
  postponeReason: string
  setPostponeReason: (v: string) => void
  groups: OutlierGroupForm[]
  createGroup: (ordinals: number[]) => void
  removeGroup: (id: string) => void
  updateGroup: (id: string, patch: Partial<OutlierGroupForm>) => void
  assignedOrdinals: Set<number>
  allOutliersAssigned: boolean
  groupsComplete: boolean
}

const OutlierEditor = ({
  outliers,
  identifierForOrdinal,
  postpone,
  setPostpone,
  postponeReason,
  setPostponeReason,
  groups,
  createGroup,
  removeGroup,
  updateGroup,
  assignedOrdinals,
  allOutliersAssigned,
  groupsComplete,
}: OutlierEditorProps) => {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)

  // Once an outlier is put into a group it leaves the table — the group card
  // below owns it from then on. Removing a group frees its members back here.
  const unassignedOutliers = outliers.filter(
    (o) => !assignedOrdinals.has(o.employeeOrdinal),
  )

  const totalPages = Math.max(
    1,
    Math.ceil(unassignedOutliers.length / OUTLIERS_PAGE_SIZE),
  )
  const currentPage = Math.min(page, totalPages)
  const pageRows = unassignedOutliers.slice(
    (currentPage - 1) * OUTLIERS_PAGE_SIZE,
    currentPage * OUTLIERS_PAGE_SIZE,
  )

  const toggleSelect = (ordinal: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(ordinal)) next.delete(ordinal)
      else next.add(ordinal)
      return next
    })

  const handleCreateGroup = () => {
    createGroup([...selected])
    setSelected(new Set())
    // The current page may no longer exist once its rows leave the table.
    setPage(1)
  }

  const columns: ColumnDef<SalaryAnalysisOutlierDto>[] = [
    {
      id: 'select',
      size: 48,
      header: () => {
        const allSelected =
          pageRows.length > 0 &&
          pageRows.every((o) => selected.has(o.employeeOrdinal))
        return (
          <Checkbox
            label=""
            checked={allSelected}
            disabled={pageRows.length === 0}
            onChange={() =>
              setSelected((prev) => {
                const next = new Set(prev)
                pageRows.forEach((o) =>
                  allSelected
                    ? next.delete(o.employeeOrdinal)
                    : next.add(o.employeeOrdinal),
                )
                return next
              })
            }
          />
        )
      },
      cell: ({ row }) => {
        const ordinal = row.original.employeeOrdinal
        return (
          <Checkbox
            label=""
            checked={selected.has(ordinal)}
            onChange={() => toggleSelect(ordinal)}
          />
        )
      },
    },
    {
      id: 'employee',
      header: d.tableEmployee,
      cell: ({ row }) => identifierForOrdinal(row.original.employeeOrdinal),
    },
    {
      id: 'salary',
      header: d.tableSalary,
      cell: ({ row }) => `${formatSalary(row.original.adjustedBaseSalary)} kr.`,
    },
    {
      id: 'difference',
      header: d.tableDifference,
      cell: ({ row }) => {
        const o = row.original
        const below = o.differencePercent < 0
        return `${Math.abs(o.differencePercent).toFixed(1)}% ${
          below ? d.directionBelow : d.directionAbove
        }`
      },
    },
  ]

  return (
    <Box>
      <Box marginBottom={2}>
        <Text variant="small">{d.intro}</Text>
      </Box>

      <Checkbox
        label={d.postponeOption}
        checked={postpone}
        onChange={(e) => setPostpone(e.target.checked)}
      />

      {postpone ? (
        <Box marginTop={2}>
          <TextInput
            name="postponeReason"
            label={t.deferReasonLabel}
            textarea
            rows={3}
            size="xs"
            value={postponeReason}
            onChange={(e) => setPostponeReason(e.target.value)}
          />
        </Box>
      ) : (
        <Box marginTop={2}>
          {unassignedOutliers.length > 0 && (
            <>
              <Table
                columns={columns}
                data={pageRows}
                paging={{
                  page: currentPage,
                  pageSize: OUTLIERS_PAGE_SIZE,
                  totalItems: unassignedOutliers.length,
                  totalPages,
                }}
                onPageChange={setPage}
                showPageSizeSelect={false}
                layout="auto"
              />

              <Box marginTop={2} marginBottom={2}>
                <Button
                  variant="ghost"
                  size="small"
                  icon="add"
                  disabled={selected.size === 0}
                  onClick={handleCreateGroup}
                >
                  {d.createGroup}
                </Button>
              </Box>
            </>
          )}

          <Accordion singleExpand={false} dividerOnTop={false} space={2}>
            {groups.map((group, index) => (
              <AccordionItem
                key={group.id}
                id={group.id}
                label={`${d.groupHeading} ${index + 1}`}
                labelVariant="h5"
                startExpanded
                visibleContent={
                  <Text variant="small">
                    {`${d.groupMembers}: ${group.ordinals
                      .map(identifierForOrdinal)
                      .join(', ')}`}
                  </Text>
                }
              >
                <Box marginBottom={1} display="flex" justifyContent="flexEnd">
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => removeGroup(group.id)}
                  >
                    {d.removeGroup}
                  </Button>
                </Box>
                <GridRow rowGap={1}>
                  <GridColumn span="12/12">
                    <TextInput
                      name={`reason-${group.id}`}
                      label={d.reasonLabel}
                      textarea
                      rows={2}
                      size="xs"
                      value={group.reason}
                      onChange={(e) =>
                        updateGroup(group.id, { reason: e.target.value })
                      }
                    />
                  </GridColumn>
                  <GridColumn span="12/12">
                    <TextInput
                      name={`action-${group.id}`}
                      label={d.actionLabel}
                      textarea
                      rows={2}
                      size="xs"
                      value={group.action}
                      onChange={(e) =>
                        updateGroup(group.id, { action: e.target.value })
                      }
                    />
                  </GridColumn>
                  <GridColumn span={['12/12', '6/12']}>
                    <TextInput
                      name={`sigName-${group.id}`}
                      label={d.signatureNameLabel}
                      size="xs"
                      value={group.signatureName}
                      onChange={(e) =>
                        updateGroup(group.id, { signatureName: e.target.value })
                      }
                    />
                  </GridColumn>
                  <GridColumn span={['12/12', '6/12']}>
                    <TextInput
                      name={`sigRole-${group.id}`}
                      label={d.signatureRoleLabel}
                      size="xs"
                      value={group.signatureRole}
                      onChange={(e) =>
                        updateGroup(group.id, { signatureRole: e.target.value })
                      }
                    />
                  </GridColumn>
                </GridRow>
              </AccordionItem>
            ))}
          </Accordion>

          {!allOutliersAssigned && (
            <Box marginTop={2}>
              <Text variant="small" color="red600">
                {d.unassignedWarning}
              </Text>
            </Box>
          )}
          {allOutliersAssigned && !groupsComplete && (
            <Box marginTop={2}>
              <Text variant="small" color="red600">
                {d.incompleteGroupWarning}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
