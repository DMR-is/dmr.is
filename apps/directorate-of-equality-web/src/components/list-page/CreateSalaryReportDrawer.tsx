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
import { useTRPC } from '../../lib/trpc/client/trpc'
import { UtilityButton } from '../buttons/UtilityButton'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const GENDER_OPTIONS = [
  { label: 'Karl', value: 'MALE' },
  { label: 'Kona', value: 'FEMALE' },
  { label: 'Kynhlutlægt', value: 'NEUTRAL' },
] as const

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
    label: `${c.name} (${c.nationalId})`,
    value: c.id,
  }))

  const importMutation = useMutation({
    ...trpc.adminReport.importWorkbook.mutationOptions(),
    onSuccess: (data) => {
      setParsedReport(data)
      toast.success('Excel skrá flutt inn')
    },
    onError: () => toast.error('Villa við innflutning á Excel skrá'),
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
      toast.success('Launagreining send inn')
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
        toast.error('Villa við innsendingu')
        return
      }

      if (!postpone) {
        toast.error(
          `Frávik fundust fyrir ${ordinals.length} starfsmenn. Merktu "Fresta skilum frávika" og gefðu ástæðu til að senda inn.`,
        )
        return
      }

      try {
        await submitMutation.mutateAsync({
          path: { companyId },
          body: {
            ...body,
            outliers: ordinals.map((employeeOrdinal) => ({
              employeeOrdinal,
              postponed: true,
              reason: postponeReason,
            })),
          },
        })
        onSuccess()
      } catch {
        toast.error('Villa við innsendingu')
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
      ariaLabel="Skrá launagreiningu"
      baseId="create-salary-report-drawer"
      disclosure={<UtilityButton icon="add">Launagreining</UtilityButton>}
    >
      <GridContainer>
        <Stack space={4}>
          <Text variant="h2">Ný launagreining</Text>

          <GridRow rowGap={[2, 3]}>
            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                Fyrirtæki
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '8/12']}>
              <Select
                name="company"
                label="Veldu fyrirtæki"
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
                backgroundColor="blue"
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                Excel innflutningur
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
                      : 'Veldu Excel skrá til að flytja inn launagreiningargögn'}
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
                  {parsedReport ? 'Skipta um skrá' : 'Velja skrá'}
                </Button>
              </Box>
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                Frávik
              </Text>
            </GridColumn>
            <GridColumn span="12/12">
              <Checkbox
                label="Fresta skilum frávika"
                checked={postpone}
                onChange={(e) => setPostpone(e.target.checked)}
                disabled={!companyId}
              />
            </GridColumn>
            {postpone && (
              <GridColumn span="12/12">
                <TextInput
                  name="postponeReason"
                  label="Ástæða frestunar"
                  textarea
                  rows={3}
                  value={postponeReason}
                  onChange={(e) => setPostponeReason(e.target.value)}
                />
              </GridColumn>
            )}

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                Æðsti stjórnandi
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="companyAdminName"
                label="Nafn"
                value={form.companyAdminName}
                onChange={(e) => set('companyAdminName')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="companyAdminEmail"
                label="Netfang"
                type="email"
                value={form.companyAdminEmail}
                onChange={(e) => set('companyAdminEmail')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <Select
                name="companyAdminGender"
                label="Kyn"
                options={GENDER_OPTIONS}
                value={GENDER_OPTIONS.find(
                  (o) => o.value === form.companyAdminGender,
                )}
                onChange={(opt) => opt && set('companyAdminGender')(opt.value)}
                backgroundColor="blue"
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                Tengiliður
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="contactName"
                label="Nafn"
                value={form.contactName}
                onChange={(e) => set('contactName')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="contactEmail"
                label="Netfang"
                type="email"
                value={form.contactEmail}
                onChange={(e) => set('contactEmail')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="contactPhone"
                label="Símanúmer"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => set('contactPhone')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                Starfsmannafjöldi
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '4/12']}>
              <TextInput
                name="averageEmployeeMaleCount"
                label="Karlar"
                type="number"
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
                label="Konur"
                type="number"
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
                label="Kynhlutlægt"
                type="number"
                value={form.averageEmployeeNeutralCount}
                onChange={(e) =>
                  set('averageEmployeeNeutralCount')(e.target.value)
                }
                disabled={!companyId}
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Inline justifyContent="flexEnd" space={2}>
                <Button variant="ghost" onClick={handleReset}>
                  Hreinsa
                </Button>
                <Button
                  disabled={!canSubmit}
                  loading={submitMutation.isPending}
                  onClick={handleSubmit}
                >
                  Senda inn
                </Button>
              </Inline>
            </GridColumn>
          </GridRow>
        </Stack>
      </GridContainer>
    </Drawer>
  )
}
