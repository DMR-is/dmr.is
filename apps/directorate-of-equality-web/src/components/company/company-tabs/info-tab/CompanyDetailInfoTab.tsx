'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'

import { CompanyDto, CompanySizeEnum } from '../../../../gen/fetch'
import { companiesText, reportText, sharedText } from '../../../../lib/text'
import { COMPANY_SIZE_LABEL, formatNationalId } from '../../../../lib/utils'
import { InfoItems } from '../../../report/report-tabs/company-tab/InfoItems'
import { CompanyTimeline } from '../../company-timeline/CompanyTimeline'

const f = sharedText.form
const d = reportText.detailFields

type Props = {
  company: CompanyDto
}

export const CompanyDetailInfoTab = ({ company }: Props) => {
  return (
    <Box marginBottom={6} marginTop={4}>
      <InfoItems
        items={[
          { label: f.companyHeading, children: company.name },
          {
            label: f.kennitalaLabel,
            children: formatNationalId(company.nationalId),
          },
          {
            label: d.employeeCount,
            children: COMPANY_SIZE_LABEL[company.employeeCountCategory],
          },
          {
            label: d.companyAdminGender,
            children: 'TODO', //company.adminGender,
          },
          {
            label: d.address,
            children: 'TODO', //company.address,
          },
          {
            label: d.city,
            children: 'TODO', //company.city,
          },
          {
            label: d.province,
            children: 'TODO', //company.province,
          },
          {
            label: d.fines,
            children: 'TODO', //company.fines,
          },
        ]}
      />

      <InfoItems
        items={[
          {
            label: companiesText.expandedRow.equalityRequired,
            children:
              company.employeeCountCategory === CompanySizeEnum.MEDIUM ||
              company.employeeCountCategory === CompanySizeEnum.LARGE
                ? sharedText.yesLabel
                : company.employeeCountCategory === CompanySizeEnum.UNKNOWN
                  ? sharedText.unknown
                  : sharedText.noLabel,
          },
          {
            label: companiesText.expandedRow.salaryRequired,
            children: company.salaryReportRequired
              ? sharedText.yesLabel
              : sharedText.noLabel,
          },
        ]}
      />

      <Box marginTop={6}>
        <CompanyTimeline />
      </Box>
    </Box>
  )
}
