'use client'

import { useRef, useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
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

import { GenderEnum, type ParsedReportDto } from '../../gen/fetch/types.gen'
import { putWorkbookToPresignedUrl } from '../../lib/import-upload'
import { overviewText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'
import { UtilityButton } from '../buttons/UtilityButton'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const t = overviewText.createSalaryReport
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

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [parsedReport, setParsedReport] = useState<ParsedReportDto | null>(null)
  const [postpone, setPostpone] = useState(false)
  const [postponeReason, setPostponeReason] = useState('')

  const set = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const companiesQuery = useQuery(
    trpc.company.list.queryOptions({ pageSize: 1000 }),
  )

  const companyOptions = (companiesQuery.data?.companies ?? []).map((c) => ({
    label: `${c.name} (${formatNationalId(c.nationalId)})`,
    value: c.id,
  }))

  const requestUploadMutation = useMutation(
    trpc.adminReport.requestImportUpload.mutationOptions(),
  )

  const importMutation = useMutation({
    ...trpc.adminReport.importWorkbook.mutationOptions(),
    onSuccess: (data) => {
      setParsedReport(data)
      toast.success(t.excelSuccessToast)
    },
    onError: () => toast.error(t.excelErrorToast),
  })

  const submitMutation = useMutation(
    trpc.adminReport.submitSalary.mutationOptions(),
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !companyId) return

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

  const handleReset = () => {
    setForm(EMPTY_FORM)
    setCompanyId(null)
    setParsedReport(null)
    setPostpone(false)
    setPostponeReason('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
      postponed: postpone,
      postponeReason: postpone ? postponeReason : undefined,
    }

    const onSuccess = () => {
      toast.success(t.successToast)
      queryClient.invalidateQueries({ queryKey: trpc.reports.list.queryKey() })
      handleReset()
    }

    try {
      // A postponed submit needs no outlier payload — the API recomputes the
      // detected set server-side and creates a single default outlier group
      // (explanation deferred). The admin tool has no per-outlier explanation
      // UI, so when outliers are detected the report must be postponed.
      await submitMutation.mutateAsync({ path: { companyId }, body })
      onSuccess()
    } catch (firstError) {
      const message = firstError instanceof Error ? firstError.message : ''
      const ordinals = parseOutlierOrdinals(message)

      if (ordinals && !postpone) {
        toast.error(
          `Frávik fundust fyrir ${ordinals.length} starfsmenn. Merktu "Fresta skilum frávika" og gefðu ástæðu til að senda inn.`,
        )
        return
      }

      toast.error(s.form.errorToast)
    }
  }

  const canSubmit =
    !!companyId &&
    !!parsedReport &&
    !!form.companyAdminName &&
    !!form.companyAdminEmail &&
    !!form.contactName &&
    !!form.contactEmail &&
    !!form.contactPhone &&
    !!form.averageEmployeeMaleCount &&
    !!form.averageEmployeeFemaleCount &&
    !!form.averageEmployeeNeutralCount &&
    (!postpone || !!postponeReason)

  return (
    <Drawer
      ariaLabel={t.drawerLabel}
      baseId="create-salary-report-drawer"
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
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              isLoading={companiesQuery.isLoading}
              size="xs"
              backgroundColor="blue"
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={1} marginBottom={4}>
          <GridColumn span="12/12">
            <Text variant="h4" marginBottom={1}>
              {t.excelHeading}
            </Text>
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
                loading={requestUploadMutation.isPending || importMutation.isPending}
                disabled={!companyId}
                onClick={() => fileInputRef.current?.click()}
              >
                {parsedReport ? t.switchFile : t.chooseFile}
              </Button>
            </Box>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={1} marginBottom={4}>
          <GridColumn span="12/12">
            <Text variant="h4" marginBottom={1}>
              {t.deviationsHeading}
            </Text>
          </GridColumn>
          <GridColumn span="12/12">
            <Checkbox
              label={t.deferLabel}
              checked={postpone}
              onChange={(e) => setPostpone(e.target.checked)}
              disabled={!companyId}
            />
          </GridColumn>
          {postpone && (
            <GridColumn span="12/12">
              <TextInput
                name="postponeReason"
                label={t.deferReasonLabel}
                textarea
                rows={3}
                size="xs"
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
              />
            </GridColumn>
          )}
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
