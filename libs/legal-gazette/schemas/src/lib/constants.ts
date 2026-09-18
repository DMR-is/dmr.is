export enum ApplicationTypeEnum {
  COMMON = 'COMMON',
  RECALL_BANKRUPTCY = 'RECALL_BANKRUPTCY',
  RECALL_DECEASED = 'RECALL_DECEASED',
}

export enum ApplicationRequirementStatementEnum {
  LIQUIDATORLOCATION = 'LIQUIDATOR_LOCATION',
  CUSTOMLIQUIDATORLOCATION = 'CUSTOM_LIQUIDATOR_LOCATION',
  CUSTOMLIQUIDATOREMAIL = 'CUSTOM_LIQUIDATOR_EMAIL',
  CUSTOMLIQUIDATORURL = 'CUSTOM_LIQUIDATOR_URL',
  CUSTOMOTHER = 'CUSTOM_OTHER',
}

/**
 * Options for the "Kröfulýsingar" select, shared by the application web and the
 * admin web so the two never drift apart. Index 0 is relied on as the default
 * selection, so only ever append new options.
 */
export const requirementsStatementOptions: Array<{
  label: string
  value: string
}> = [
  {
    label: 'Staðsetning skiptastjóra',
    value: ApplicationRequirementStatementEnum.LIQUIDATORLOCATION,
  },
  {
    label: 'Slá inn staðsetningu',
    value: ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORLOCATION,
  },
  {
    label: 'Tölvupóstur',
    value: ApplicationRequirementStatementEnum.CUSTOMLIQUIDATOREMAIL,
  },
  {
    label: 'Vefsvæði',
    value: ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORURL,
  },
  {
    label: 'Annað',
    value: ApplicationRequirementStatementEnum.CUSTOMOTHER,
  },
]

const REQUIREMENT_STATEMENT_LOCATION_LABELS: Record<
  ApplicationRequirementStatementEnum,
  string
> = {
  [ApplicationRequirementStatementEnum.LIQUIDATORLOCATION]:
    'Staðsetning skiptastjóra',
  [ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORLOCATION]:
    'Innslegin staðsetning',
  [ApplicationRequirementStatementEnum.CUSTOMLIQUIDATOREMAIL]: 'Tölvupóstur',
  [ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORURL]: 'Vefslóð',
  [ApplicationRequirementStatementEnum.CUSTOMOTHER]: 'Annað',
}

/**
 * Label for the free-text field that sits next to the select. Takes a plain
 * string so callers can pass a value typed by their own generated client enum,
 * which TypeScript treats as a distinct nominal type.
 */
export const getRequirementStatementLocationLabel = (
  statementType?: string | null,
): string =>
  REQUIREMENT_STATEMENT_LOCATION_LABELS[
    statementType as ApplicationRequirementStatementEnum
  ] ??
  REQUIREMENT_STATEMENT_LOCATION_LABELS[
    ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
  ]

export enum SettlementType {
  DEFAULT = 'DEFAULT',
  UNDIVIDED = 'UNDIVIDED',
  OWNER = 'OWNER',
}
