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
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { type ParsedReportDto } from '../../gen/fetch/types.gen'
import { overviewText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'
import { UtilityButton } from '../buttons/UtilityButton'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const GENDER_OPTIONS = [
  { label: sharedText.genders.male, value: 'MALE' as const },
  { label: sharedText.genders.female, value: 'FEMALE' as const },
  { label: sharedText.genders.neutral, value: 'NEUTRAL' as const },
]

const EMPTY_FORM = {
  companyAdminName: '',
  companyAdminEmail: '',
  companyAdminGender: 'MALE' as 'MALE' | 'FEMALE' | 'NEUTRAL',
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

  const importMutation = useMutation({
    ...trpc.adminReport.importWorkbook.mutationOptions(),
    onSuccess: (data) => {
      setParsedReport(data)
      toast.success(overviewText.createSalaryReport.excelSuccessToast)
    },
    onError: () => toast.error(overviewText.createSalaryReport.excelErrorToast),
  })

  const submitMutation = useMutation(
    trpc.adminReport.submitSalary.mutationOptions(),
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !companyId) return

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      importMutation.mutate({
        path: { companyId },
        body: { file: base64 },
      })
    }
    reader.readAsDataURL(file)
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
    }

    const onSuccess = () => {
      toast.success(overviewText.createSalaryReport.successToast)
      queryClient.invalidateQueries({ queryKey: trpc.reports.list.queryKey() })
      handleReset()
    }

    try {
      await submitMutation.mutateAsync({ path: { companyId }, body })
      onSuccess()
    } catch (firstError) {
      const message = firstError instanceof Error ? firstError.message : ''
      const ordinals = parseOutlierOrdinals(message)

      if (!ordinals) {
        toast.error(overviewText.createSalaryReport.errorToast)
        return
      }

      if (!postpone) {
        toast.error(
          `Frávik fundust fyrir ${ordinals.length} starfsmenn. Merktu "${overviewText.createSalaryReport.deferLabel}" og gefðu ástæðu til að senda inn.`,
        )
        return
      }

      try {
        await submitMutation.mutateAsync({
          path: { companyId },
          body: {
            ...body,
            postponed: true,
            outliers: ordinals.map((employeeOrdinal) => ({ employeeOrdinal })),
          },
        })
        onSuccess()
      } catch {
        toast.error(overviewText.createSalaryReport.errorToast)
      }
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
      ariaLabel={overviewText.createSalaryReport.drawerLabel}
      baseId="create-salary-report-drawer"
      disclosure={
        <UtilityButton icon="add" fluid>
          {overviewText.createSalaryReport.buttonLabel}
        </UtilityButton>
      }
    >
      <GridContainer>
        <Stack space={4}>
          <Text variant="h2">{overviewText.createSalaryReport.heading}</Text>

          <GridRow rowGap={[2, 3]}>
            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {sharedText.form.companyHeading}
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '8/12']}>
              <Select
                name="company"
                label={sharedText.form.companySelect}
                options={companyOptions}
                value={
                  companyOptions.find((o) => o.value === companyId) ?? null
                }
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

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {overviewText.createSalaryReport.excelHeading}
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
                      : overviewText.createSalaryReport.excelPlaceholder}
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
                  loading={importMutation.isPending}
                  disabled={!companyId}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {parsedReport
                    ? overviewText.createSalaryReport.switchFile
                    : overviewText.createSalaryReport.chooseFile}
                </Button>
              </Box>
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {overviewText.createSalaryReport.deviationsHeading}
              </Text>
            </GridColumn>
            <GridColumn span="12/12">
              <Checkbox
                label={overviewText.createSalaryReport.deferLabel}
                checked={postpone}
                onChange={(e) => setPostpone(e.target.checked)}
                disabled={!companyId}
              />
            </GridColumn>
            {postpone && (
              <GridColumn span="12/12">
                <TextInput
                  name="postponeReason"
                  label={overviewText.createSalaryReport.deferReasonLabel}
                  textarea
                  rows={3}
                  size="xs"
                  value={postponeReason}
                  onChange={(e) => setPostponeReason(e.target.value)}
                />
              </GridColumn>
            )}

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {sharedText.form.topManagerHeading}
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="companyAdminName"
                label={sharedText.form.nameLabel}
                size="xs"
                value={form.companyAdminName}
                onChange={(e) => set('companyAdminName')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="companyAdminEmail"
                label={sharedText.form.emailLabel}
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
                label={sharedText.form.genderLabel}
                options={GENDER_OPTIONS}
                value={GENDER_OPTIONS.find(
                  (o) => o.value === form.companyAdminGender,
                )}
                onChange={(opt) => opt && set('companyAdminGender')(opt.value)}
                size="xs"
                backgroundColor="blue"
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {sharedText.form.contactHeading}
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="contactName"
                label={sharedText.form.nameLabel}
                size="xs"
                value={form.contactName}
                onChange={(e) => set('contactName')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="contactEmail"
                label={sharedText.form.emailLabel}
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
                label={sharedText.form.phoneLabel}
                type="tel"
                size="xs"
                value={form.contactPhone}
                onChange={(e) => set('contactPhone')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {overviewText.createSalaryReport.employeeCountHeading}
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <TextInput
                name="averageEmployeeMaleCount"
                label={overviewText.createSalaryReport.maleCountLabel}
                type="number"
                size="xs"
                value={form.averageEmployeeMaleCount}
                onChange={(e) =>
                  set('averageEmployeeMaleCount')(e.target.value)
                }
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <TextInput
                name="averageEmployeeFemaleCount"
                label={overviewText.createSalaryReport.femaleCountLabel}
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
                label={overviewText.createSalaryReport.neutralCountLabel}
                type="number"
                size="xs"
                value={form.averageEmployeeNeutralCount}
                onChange={(e) =>
                  set('averageEmployeeNeutralCount')(e.target.value)
                }
                disabled={!companyId}
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Inline justifyContent="flexEnd" space={2}>
                <Button variant="ghost" size="small" onClick={handleReset}>
                  {overviewText.createSalaryReport.reset}
                </Button>
                <Button
                  size="small"
                  disabled={!canSubmit}
                  loading={submitMutation.isPending}
                  onClick={handleSubmit}
                >
                  {overviewText.createSalaryReport.submit}
                </Button>
              </Inline>
            </GridColumn>
          </GridRow>
        </Stack>
      </GridContainer>
    </Drawer>
  )
}
