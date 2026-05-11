'use client'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { CompanyReportDto } from '../../../../gen/fetch'
import { formatNationalId } from '../../../../lib/utils'
import { InfoItems } from './InfoItems'

//TODO: revisit
interface CompanyInfoTabProps {
  companyData: CompanyReportDto
  adminData?: {
    name?: string
    email?: string
    gender?: string
  }
  contactPersonData?: {
    name?: string
    email?: string
    phone?: string
  }
  employeesData?: {
    womenCount?: number
    menCount?: number
    otherCount?: number
  }
  daughterCompanyData?: {
    name?: string
    nationalId?: string
  }[]
}

export const CompanyInfoTab = ({
  companyData,
  adminData,
  contactPersonData,
  employeesData,
  daughterCompanyData,
}: CompanyInfoTabProps) => {
  return (
    <Box marginBottom={6} marginTop={4}>
      <Accordion singleExpand={false} dividerOnTop={false} space={'p5'}>
        <AccordionItem
          id="company-name"
          label="Upplýsingar fyrirtækis"
          startExpanded
        >
          <InfoItems
            items={[
              { label: 'Fyrirtæki', children: companyData.name },
              {
                label: 'Kennitala',
                children: formatNationalId(companyData.nationalId),
              },
              { label: 'Heimilisfang', children: companyData.address },
              { label: 'Sveitarfélag', children: companyData.city },
              {
                label: 'Fjöldi starfsmanna',
                children: companyData.averageEmployeeCountFromRsk,
              },
              {
                label: 'ÍSAT atvinnugreinaflokkun',
                children: companyData.isatCategory,
              },
            ]}
          />
        </AccordionItem>
        <AccordionItem id="company-admin" label="Æðsti stjórnandi">
          <InfoItems
            items={[
              { label: 'Nafn', children: adminData?.name },
              { label: 'Netfang', children: adminData?.email },
              { label: 'Kyn', children: adminData?.gender },
            ]}
          />
        </AccordionItem>
        <AccordionItem id="company-contact-person" label="Tengiliður">
          <InfoItems
            items={[
              { label: 'Nafn', children: contactPersonData?.name },
              { label: 'Netfang', children: contactPersonData?.email },
              { label: 'Sími', children: contactPersonData?.phone },
            ]}
          />
        </AccordionItem>
        <AccordionItem
          id="company-average-employees"
          label="Meðalfjöldi starfsmanna"
        >
          <InfoItems
            colCount={3}
            items={[
              { label: 'Konur', children: employeesData?.womenCount },
              { label: 'Karlar', children: employeesData?.menCount },
              {
                label: 'Hlutlaus skráning kyns í Þjóðskrá',
                children: employeesData?.otherCount,
              },
            ]}
          />
        </AccordionItem>
        {daughterCompanyData && daughterCompanyData.length > 0 && (
          <AccordionItem id="company-daughter-companies" label="Dótturfélög">
            <InfoItems
              items={daughterCompanyData.map((daughter) => ({
                label: daughter.name ?? 'Óþekkt',
                children: daughter.nationalId
                  ? formatNationalId(daughter.nationalId)
                  : 'Óþekkt',
              }))}
            />
          </AccordionItem>
        )}
      </Accordion>
    </Box>
  )
}
