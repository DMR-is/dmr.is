'use client'

import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'

import { type CompanyDto } from '../../gen/fetch/types.gen'
import { companiesText } from '../../lib/text'
import {
  EQUALITY_DETAIL_LABEL,
  OBLIGATION_STATUS_TAG_VARIANT,
  SALARY_DETAIL_LABEL,
  SALARY_OBLIGATION_TAG_VARIANT,
} from '../companies/companyStatus'

type Props = {
  company: CompanyDto
}

/**
 * The company header's compliance tags — one per obligation the company has.
 *
 * ⚠️ Reads `equalityObligationStatus` / `salaryObligationStatus`, NOT the
 * roll-up `reportStatus` this header used to show. The roll-up names only the
 * most pressing problem, so a company missing both reports rendered a single
 * "Vantar jafnréttisáætlun" and the launagreining went unmentioned on the one
 * page dedicated to that company.
 *
 * An obligation the company does not have renders nothing: "Á ekki við" earns a
 * cell in the list because the column has to be filled, but on the company's own
 * page it is a badge asserting an absence. When neither obligation applies the
 * header would then be bare, which reads as missing data rather than as "owes
 * nothing" — so that case gets its own tag, using the same wording as the list
 * filter ("Ekki lagaskylt") so the two are recognisably the same idea.
 *
 * `light` throughout, matching the list.
 */
export const CompanyObligationTags = ({ company }: Props) => {
  const equalityLabel = EQUALITY_DETAIL_LABEL[company.equalityObligationStatus]
  const salaryLabel = SALARY_DETAIL_LABEL[company.salaryObligationStatus]

  if (!equalityLabel && !salaryLabel) {
    return (
      <Tag variant="dark" outlined disabled light>
        {companiesText.notLegallyObliged}
      </Tag>
    )
  }

  return (
    <Inline space={1} alignY="center" flexWrap="wrap">
      {equalityLabel && (
        <Tag
          variant={
            OBLIGATION_STATUS_TAG_VARIANT[company.equalityObligationStatus] ??
            'dark'
          }
          outlined
          disabled
          light
        >
          {equalityLabel}
        </Tag>
      )}
      {salaryLabel && (
        <Tag
          variant={
            SALARY_OBLIGATION_TAG_VARIANT[company.salaryObligationStatus] ??
            'dark'
          }
          outlined
          disabled
          light
        >
          {salaryLabel}
        </Tag>
      )}
    </Inline>
  )
}
