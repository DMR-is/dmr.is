import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

import { useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { LinkV2 } from '@island.is/island-ui/core'

import { useIssues } from '../../hooks/issues/useIssues'
import { getDmrClient } from '../../lib/api/createClient'
import { loginRedirect } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

const MONTH_OPTIONS = [
  { label: 'Janúar', value: 0 },
  { label: 'Febrúar', value: 1 },
  { label: 'Mars', value: 2 },
  { label: 'Apríl', value: 3 },
  { label: 'Maí', value: 4 },
  { label: 'Júní', value: 5 },
  { label: 'Júlí', value: 6 },
  { label: 'Ágúst', value: 7 },
  { label: 'September', value: 8 },
  { label: 'Október', value: 9 },
  { label: 'Nóvember', value: 10 },
  { label: 'Desember', value: 11 },
]

const getYearOptions = (from = 1999) => {
  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let year = from; year <= currentYear; year++) {
    yearOptions.push({ label: year.toString(), value: year })
  }

  return yearOptions
}

const YEAR_OPTIONS = getYearOptions()

type Props = {
  departmentOptions: { label: string; value: string }[]
}

export default function IssuesPage({ departmentOptions }: Props) {
  const { issues, isLoading, generateIssues, isGenerating } = useIssues()

  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    departmentOptions[0].value,
  )

  const [selectedMonth, setSelectedMonth] = useState<number>(
    MONTH_OPTIONS.find((month) => month.value === new Date().getMonth())
      ?.value ?? 0,
  )
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  )

  if (isLoading) {
    return <div>Sæki hefti...</div>
  }

  return (
    <GridContainer>
      <GridRow marginBottom={[2, 3]} rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <Text>Búa til hefti fyrir tímabil</Text>
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
            options={MONTH_OPTIONS}
            size="sm"
            backgroundColor="blue"
            defaultValue={MONTH_OPTIONS.find(
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
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span="12/12">
          <h1>Hefti</h1>
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <ul>
            {issues?.issues.map((issue) => (
              <li key={issue.id}>
                <LinkV2 href={issue.url} newTab={true}>
                  {issue.formattedTitle}
                </LinkV2>
              </li>
            ))}
          </ul>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  resolvedUrl,
}) => {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const client = getDmrClient(session?.idToken as string)

  const { departments } = await client.getDepartments({})

  return {
    props: {
      departmentOptions: departments.map((dept) => ({
        label: dept.title,
        value: dept.id,
      })),
    },
  }
}
