'use client'

import { useState } from 'react'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Drawer } from '@dmr.is/ui/components/island-is/Drawer'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { MONTH_OPTIONS_ZERO_BASED, YEAR_OPTIONS } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export const CreateIssue = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: departmentsData } = useSuspenseQuery(
    trpc.getDepartments.queryOptions({}),
  )

  const departmentOptions = departmentsData.departments.map((dept) => ({
    label: dept.title,
    value: dept.id,
  }))

  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    departmentOptions[0]?.value ?? '',
  )

  const [selectedMonth, setSelectedMonth] = useState<number>(
    MONTH_OPTIONS_ZERO_BASED.find(
      (month) => month.value === new Date().getMonth(),
    )?.value ?? 0,
  )
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  )

  const { mutate: generateIssues, isPending: isGenerating } = useMutation(
    trpc.generateMonthlyIssues.mutationOptions({
      onSuccess: () => {
        toast.success('Hefti búið til')
        queryClient.invalidateQueries(trpc.getMonthlyIssues.queryFilter())
      },
      onError: () => {
        toast.error(`Ekki tókst að búa til hefti`)
      },
    }),
  )

  return (
    <Drawer
      ariaLabel="Bæta við hefti"
      baseId="create-issue-drawer"
      disclosure={
        <Button
          variant="utility"
          size="small"
          icon="document"
          iconType="outline"
        >
          Bæta við hefti
        </Button>
      }
    >
      <GridContainer>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span="12/12">
            <Text marginBottom={1} variant="h2">
              Bæta við hefti
            </Text>
            <Text marginBottom={2}>
              Hægt er bæta við nýju hefti sem er ekki til nú þegar, eða uppfæra
              hefti sem er til.
            </Text>
          </GridColumn>
          <GridColumn span={['12/12', '4/12']}>
            <Select
              name="department"
              label="Deild"
              options={departmentOptions}
              size="sm"
              defaultValue={departmentOptions.find(
                (dept) => dept.value === selectedDepartment,
              )}
              backgroundColor="blue"
              onChange={(opt) => {
                if (!opt) return
                setSelectedDepartment(opt.value)
              }}
            />
          </GridColumn>
          <GridColumn span={['12/12', '4/12']}>
            <Select
              onChange={(opt) => {
                if (!opt) return
                setSelectedMonth(opt.value)
              }}
              name="month"
              label="Mánuður"
              options={MONTH_OPTIONS_ZERO_BASED}
              size="sm"
              backgroundColor="blue"
              defaultValue={MONTH_OPTIONS_ZERO_BASED.find(
                (month) => month.value === selectedMonth,
              )}
            />
          </GridColumn>
          <GridColumn span={['12/12', '4/12']}>
            <Select
              onChange={(opt) => {
                if (!opt) return
                setSelectedYear(opt.value)
              }}
              name="year"
              label="Ár"
              options={YEAR_OPTIONS}
              size="sm"
              backgroundColor="blue"
              defaultValue={YEAR_OPTIONS[YEAR_OPTIONS.length - 1]}
            />
          </GridColumn>
          <GridColumn span="12/12">
            <Inline align="right">
              <Button
                loading={isGenerating}
                disabled={
                  !selectedDepartment ||
                  selectedMonth === undefined ||
                  selectedYear === undefined
                }
                icon="add"
                onClick={() =>
                  generateIssues({
                    date: new Date(selectedYear, selectedMonth),
                    departmentId: selectedDepartment,
                  })
                }
              >
                Búa til hefti
              </Button>
            </Inline>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Drawer>
  )
}
