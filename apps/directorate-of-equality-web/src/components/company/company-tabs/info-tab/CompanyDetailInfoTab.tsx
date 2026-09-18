'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'

import { CompanyDto, CompanySizeEnum } from '../../../../gen/fetch'
import { companiesText, reportText, sharedText } from '../../../../lib/text'
import {
  COMPANY_SIZE_LABEL,
  formatIsatCategory,
  formatNationalId,
} from '../../../../lib/utils'
import { InfoItems } from '../../../report/report-tabs/company-tab/InfoItems'
import { CompanyTimeline } from '../../company-timeline/CompanyTimeline'
import { CompanyEmailField } from './CompanyEmailField'
import { CompanyRegisterStatusField } from './CompanyRegisterStatusField'
import { CompanySectorField } from './CompanySectorField'

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
            label: companiesText.detailView.registerStatusLabel,
            children: <CompanyRegisterStatusField company={company} />,
          },

          {
            label: d.email,
            children: <CompanyEmailField company={company} />,
          },

          {
            label: d.address,
            children: company.address,
          },

          {
            label: companiesText.detailView.sectorLabel,
            children: <CompanySectorField company={company} />,
          },

          // Read-only. The admin-owned ÍSAT code is set by the annual
          // classification pass, not from here — `PATCH /companies/{id}/isat`
          // exists but is not exposed through tRPC, so there is nothing to edit
          // against yet. `undefined` falls through to InfoItems' "Óþekkt".
          {
            label: companiesText.isatCategory,
            children: formatIsatCategory(company),
          },

          {
            label: d.fines,
            children: company.finesStarted
              ? sharedText.yesLabel
              : sharedText.noLabel,
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
        <CompanyTimeline companyId={company.id} companyName={company.name} />
      </Box>
    </Box>
  )
}
