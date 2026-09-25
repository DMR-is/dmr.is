import { registerDecorator, ValidationOptions } from 'class-validator'

import { ParsedEmployeeDto } from '../../report-excel/dto/parsed-report.dto'
import { isKennitalaLike } from './kennitala-validators'
import {
  employeeLabel,
  PayloadIssueBag,
  PayloadIssueScope,
} from './parsed-payload-issues'

/**
 * Per-employee field rules that hold on every channel.
 *
 * They sit in the payload integrity pass rather than on one channel's DTO
 * because the island.is, partner and workbook paths all converge on
 * `ParsedReportDto`, and a rule on one DTO is a rule the other two skip. The
 * draft employee DTOs restate them, since a draft is written a row at a time
 * and never passes through here.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** The pay components summed into reglulegt tímakaup and aukagreiðslur. */
const PAY_FIELDS = [
  ['baseSalary', 'grunnlaun'],
  ['additionalFixedOvertime', 'föst yfirvinna'],
  ['additionalFixedCarAllowance', 'fastur bílastyrkur'],
  ['additionalFixedOther', 'önnur föst viðbótarlaun'],
  ['bonusOccasionalOvertime', 'tilfallandi yfirvinna'],
  ['bonusOccasionalCarAllowance', 'tilfallandi bílastyrkur'],
  ['bonusOther', 'aðrar aukagreiðslur'],
] as const satisfies ReadonlyArray<readonly [keyof ParsedEmployeeDto, string]>

/** Today as `YYYY-MM-DD` in UTC, which is Icelandic time. */
export const todayIsoDate = (now: Date = new Date()): string =>
  now.toISOString().slice(0, 10)

/**
 * A real calendar date. `2026-02-30` is refused, where a `Date` round trip
 * would silently roll it into March.
 */
export const isCalendarDate = (value: string): boolean => {
  const match = ISO_DATE.exec(value)
  if (!match) {
    return false
  }
  const [, y, m, d] = match.map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

export function collectEmployeeFieldIssues(
  employee: ParsedEmployeeDto,
  issues: PayloadIssueBag,
  today: string = todayIsoDate(),
): void {
  const label = employeeLabel(employee.ordinal)
  const at = { ordinal: employee.ordinal }

  // The ordinal is the employee's identity for the whole submission — outlier
  // groups and the analysis reference it — so it has to be a count, not a
  // measurement.
  if (!Number.isInteger(employee.ordinal) || employee.ordinal < 1) {
    issues.add(
      PayloadIssueScope.EMPLOYEES,
      `${label}: raðnúmer verður að vera heil tala, 1 eða hærri`,
      at,
    )
  }

  // Shown to reviewers beside every flagged row. It is the employer's own
  // handle for tracing a row back internally, and a kennitala there publishes
  // a national id to everyone who reads the report.
  if (isKennitalaLike(employee.identifier)) {
    issues.add(
      PayloadIssueScope.EMPLOYEES,
      `${label}: auðkenni má ekki vera kennitala — notið eigið auðkenni fyrirtækisins`,
      at,
    )
  }

  if (!isCalendarDate(employee.startDate)) {
    issues.add(
      PayloadIssueScope.EMPLOYEES,
      `${label}: ráðningardagsetning „${employee.startDate}“ er ekki gild dagsetning (YYYY-MM-DD)`,
      at,
    )
  } else if (employee.startDate > today) {
    issues.add(
      PayloadIssueScope.EMPLOYEES,
      `${label}: ráðningardagsetning ${employee.startDate} er í framtíðinni`,
      at,
    )
  }

  // A negative component lowers the employee's pay in the regression without
  // any sign that it was a correction rather than a wage.
  for (const [field, name] of PAY_FIELDS) {
    const value = employee[field]
    if (value !== null && value !== undefined && value < 0) {
      issues.add(
        PayloadIssueScope.EMPLOYEES,
        `${label}: ${name} mega ekki vera neikvæð (${value})`,
        at,
      )
    }
  }
}

/**
 * The start-date rule above, for the draft employee DTOs: a calendar date, no
 * later than today. A draft is written a row at a time and never passes the
 * payload integrity pass, so its DTOs carry the rule themselves.
 */
export function IsStartDate(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isStartDate',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a date of the form YYYY-MM-DD, no later than today`,
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' &&
          isCalendarDate(value) &&
          value <= todayIsoDate(),
      },
    })
}
