'use client'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { CompanyDto } from '../../../../gen/fetch'
import { reportText, sharedText } from '../../../../lib/text'
import { COMPANY_SIZE_LABEL, formatNationalId } from '../../../../lib/utils'
import { InfoItems } from '../../../report/report-tabs/company-tab/InfoItems'

const f = sharedText.form
const d = reportText.detailFields

type Props = {
  company: CompanyDto
}

export const CompanyDetailInfoTab = ({ company }: Props) => {
  return (
    <Box marginBottom={6} marginTop={4}>
      <Accordion singleExpand={false} dividerOnTop={false} space={'p5'}>
        <AccordionItem
          id="company-basic-info"
          label={reportText.companyTab.companyInfoHeading}
          startExpanded
        >
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
            ]}
          />
        </AccordionItem>
        <AccordionItem
          id="company-report-settings"
          label="Skýrslugjöf"
          startExpanded
        >
          <InfoItems
            items={[
              {
                label: 'Launagreining skylda',
                children: company.salaryReportRequired ? 'Já' : 'Nei',
              },
              {
                label: 'Yfirskrift launagreiningar',
                children: company.salaryReportRequiredOverride ? 'Já' : 'Nei',
              },
            ]}
          />
        </AccordionItem>
      </Accordion>
    </Box>
  )
}
