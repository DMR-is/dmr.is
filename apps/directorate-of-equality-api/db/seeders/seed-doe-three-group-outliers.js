'use strict'

// Test scenario: a single SALARY report whose detected outliers are split
// across THREE explained outlier groups, to exercise the per-group tables in
// the salary report tab (one table per group, group reason/action/signature
// rendered below each table). Built from the same shared excel + analysis
// fixtures as seed-doe-rich-scenario.js so the salary tab renders fully
// (distribution chart, statistics, role results), then the outliers are
// distributed round-robin across three groups.
//
// Additive + self-contained: uses its own company slot (N = 30) and id range
// (uid 30000+), so `db:seed:all` runs it without touching other seeders. The
// down() is scoped to this company only.

const fs = require('fs')
const path = require('path')

// Reviewer from initial seed (matches the other DoE seeders).
const REVIEWER_ID = 'b4e98cee-a4d8-4924-90df-b820c4bc0801'

// UUID helpers — valid v4 shape (version 4, variant 8) so they pass strict
// UUID validation (zod `z.uuid()`) on the outliers `groupId` query param.
const cid = (n) =>
  `c${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`
const eid = (n) =>
  `e${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`
const sid = (n) =>
  `b${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`
const uid = (n) =>
  `f${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`

// Company slot 30 — distinct from seed-doe-scenarios.js (1–28) and
// seed-doe-rich-scenario.js (29).
const N = 30
const COMPANY_ID = cid(N)
const EQ_REPORT_ID = eid(N)
const SAL_REPORT_ID = sid(N)
const NATIONAL_ID = '5001010030'
const COMPANY_NAME = 'Þríhópa Prófunarfélagið hf.'

// Auxiliary id counter; all uid() values for this seeder live above 30000 so
// they don't intersect the other DoE seeders.
let nextUid = 30000
const newUid = () => uid(nextUid++)

// SQL string literal helpers ------------------------------------------------
const escStr = (s) =>
  s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`
const escJson = (obj) => `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`
const num = (n) => (n === null || n === undefined ? 'NULL' : String(n))

// Load source data ----------------------------------------------------------
const dataDir = path.join(__dirname, 'data')
const excel = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'excel-import-test-res.json'), 'utf8'),
)
const analysis = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'salary-analysis-test-res.json'), 'utf8'),
)

// Pre-allocate ids + build lookup maps --------------------------------------
const criterionIds = excel.criteria.map(() => newUid())

const subCriterionRows = [] // { id, criterionId, criterionTitle, sub }
const stepRows = [] // { id, subCriterionId, order, description, score }
const stepIdByKey = new Map() // key: `${critTitle}|${subTitle}|${stepOrder}` -> uid

excel.criteria.forEach((crit, ci) => {
  crit.subCriteria.forEach((sub) => {
    const subId = newUid()
    subCriterionRows.push({
      id: subId,
      criterionId: criterionIds[ci],
      criterionTitle: crit.title,
      sub,
    })
    sub.steps.forEach((step) => {
      const stepId = newUid()
      stepRows.push({
        id: stepId,
        subCriterionId: subId,
        order: step.order,
        description: step.description,
        score: step.score,
      })
      stepIdByKey.set(`${crit.title}|${sub.title}|${step.order}`, stepId)
    })
  })
})

const roleIdByTitle = new Map()
excel.roles.forEach((r) => roleIdByTitle.set(r.title, newUid()))

const empIdByOrdinal = new Map()
excel.employees.forEach((e) => empIdByOrdinal.set(e.ordinal, newUid()))

// Module export -------------------------------------------------------------
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(companySql())
    await queryInterface.sequelize.query(equalityReportSql())
    await queryInterface.sequelize.query(salaryReportSql())
    await queryInterface.sequelize.query(criteriaSql())
    await queryInterface.sequelize.query(rolesSql())
    await queryInterface.sequelize.query(employeesSql())
    await queryInterface.sequelize.query(resultSql())
    await queryInterface.sequelize.query(outliersSql())
    await queryInterface.sequelize.query(eventsSql())
  },
  async down(queryInterface) {
    return await queryInterface.sequelize.query(downSql())
  },
}

// 1. Company ----------------------------------------------------------------
function companySql() {
  return `
BEGIN;
INSERT INTO company (id, name, national_id, employee_count_category, salary_report_required_override)
VALUES (${escStr(COMPANY_ID)}, ${escStr(COMPANY_NAME)}, ${escStr(NATIONAL_ID)}, 'LARGE', FALSE);
COMMIT;
  `
}

// 2. Equality report — APPROVED so the salary report can reference it -------
function equalityReportSql() {
  const eqCompanyReportId = newUid()
  const evSubmitted = newUid()
  const evInReview = newUid()
  const evApproved = newUid()
  return `
BEGIN;

INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content,
  reviewer_user_id, approved_at, valid_until)
VALUES (${escStr(EQ_REPORT_ID)}, 'EQUALITY', 'APPROVED', ${escStr(NATIONAL_ID)},
  'Þóra Þórsdóttir', 'thora@thrihopa.is', 'FEMALE',
  'Þóra Þórsdóttir', 'thora@thrihopa.is', '888-8888',
  'ISLAND_IS', 'prov-eq-030', 'JR-2026-030',
  'Jafnréttisáætlun Þríhópa Prófunarfélagsins 2026–2029.',
  ${escStr(REVIEWER_ID)},
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days' + INTERVAL '3 years');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES (${escStr(eqCompanyReportId)}, ${escStr(COMPANY_ID)}, ${escStr(EQ_REPORT_ID)}, NULL,
  ${escStr(COMPANY_NAME)}, ${escStr(NATIONAL_ID)}, 'Borgartún 30', 'Reykjavík', '105', 'LARGE', 'M');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES (${escStr(evSubmitted)}, ${escStr(EQ_REPORT_ID)}, 'SUBMITTED', NULL, 'SUBMITTED', ${escStr(COMPANY_ID)});
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES (${escStr(evInReview)}, ${escStr(EQ_REPORT_ID)}, 'STATUS_CHANGED', ${escStr(REVIEWER_ID)}, 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', ${escStr(COMPANY_ID)});
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES (${escStr(evApproved)}, ${escStr(EQ_REPORT_ID)}, 'STATUS_CHANGED', ${escStr(REVIEWER_ID)}, 'APPROVED',
  'IN_REVIEW', 'APPROVED', ${escStr(COMPANY_ID)});

COMMIT;
  `
}

// 3. Salary report row + company_report snapshot ----------------------------
function salaryReportSql() {
  const salCompanyReportId = newUid()
  let male = 0
  let female = 0
  let neutral = 0
  excel.employees.forEach((e) => {
    if (e.gender === 'MALE') male++
    else if (e.gender === 'FEMALE') female++
    else neutral++
  })

  return `
BEGIN;

INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_id,
  average_employee_male_count, average_employee_female_count, average_employee_neutral_count,
  imported_from_excel, reviewer_user_id)
VALUES (${escStr(SAL_REPORT_ID)}, 'SALARY', 'IN_REVIEW', ${escStr(NATIONAL_ID)},
  'Þóra Þórsdóttir', 'thora@thrihopa.is', 'FEMALE',
  'Þóra Þórsdóttir', 'thora@thrihopa.is', '888-8888',
  'ISLAND_IS', 'prov-sal-030', 'LS-2026-030',
  ${escStr(EQ_REPORT_ID)},
  ${num(male)}, ${num(female)}, ${num(neutral)},
  TRUE,
  ${escStr(REVIEWER_ID)});

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES (${escStr(salCompanyReportId)}, ${escStr(COMPANY_ID)}, ${escStr(SAL_REPORT_ID)}, NULL,
  ${escStr(COMPANY_NAME)}, ${escStr(NATIONAL_ID)}, 'Borgartún 30', 'Reykjavík', '105', 'LARGE', 'M');

COMMIT;
  `
}

// 4. Criteria + sub-criteria + steps ---------------------------------------
function criteriaSql() {
  const critValues = excel.criteria
    .map(
      (c, i) =>
        `  (${escStr(criterionIds[i])}, ${escStr(SAL_REPORT_ID)}, ${escStr(c.title)}, ${num(
          c.weight,
        )}, ${escStr(c.description)}, ${escStr(c.type)})`,
    )
    .join(',\n')

  const subValues = subCriterionRows
    .map(
      (r) =>
        `  (${escStr(r.id)}, ${escStr(r.criterionId)}, ${escStr(r.sub.title)}, ${escStr(
          r.sub.description,
        )}, ${num(r.sub.weight)})`,
    )
    .join(',\n')

  const stepValues = stepRows
    .map(
      (s) =>
        `  (${escStr(s.id)}, ${escStr(s.subCriterionId)}, ${num(s.order)}, ${escStr(
          s.description,
        )}, ${num(Number(s.score).toFixed(2))})`,
    )
    .join(',\n')

  return `
BEGIN;

INSERT INTO report_criterion (id, report_id, title, weight, description, type) VALUES
${critValues};

INSERT INTO report_sub_criterion (id, report_criterion_id, title, description, weight) VALUES
${subValues};

INSERT INTO report_sub_criterion_step (id, report_sub_criterion_id, "order", description, score) VALUES
${stepValues};

COMMIT;
  `
}

// 5. Roles + role→step assignments ------------------------------------------
function rolesSql() {
  const roleValues = excel.roles
    .map((r) => `  (${escStr(roleIdByTitle.get(r.title))}, ${escStr(r.title)})`)
    .join(',\n')

  const assignmentValues = []
  excel.roles.forEach((r) => {
    const roleId = roleIdByTitle.get(r.title)
    r.stepAssignments.forEach((sa) => {
      const stepId = stepIdByKey.get(
        `${sa.criterionTitle}|${sa.subTitle}|${sa.stepOrder}`,
      )
      if (!stepId) {
        throw new Error(
          `Missing step for role "${r.title}" assignment ${sa.criterionTitle}/${sa.subTitle}/${sa.stepOrder}`,
        )
      }
      assignmentValues.push(
        `  (${escStr(newUid())}, ${escStr(roleId)}, ${escStr(stepId)})`,
      )
    })
  })

  return `
BEGIN;

INSERT INTO report_employee_role (id, title) VALUES
${roleValues};

INSERT INTO report_employee_role_criterion_step (id, report_employee_role_id, report_sub_criterion_step_id) VALUES
${assignmentValues.join(',\n')};

COMMIT;
  `
}

// 6. Employees + personal step assignments ----------------------------------
function employeesSql() {
  const scoreByOrdinal = new Map()
  analysis.baseSalaryByGenderAndScoreAll.dataPoints.forEach((dp, i) => {
    scoreByOrdinal.set(i + 1, dp.score)
  })

  const empValues = excel.employees
    .map((e) => {
      const empId = empIdByOrdinal.get(e.ordinal)
      const roleId = roleIdByTitle.get(e.roleTitle)
      if (!roleId) throw new Error(`Unknown role "${e.roleTitle}"`)
      const score = scoreByOrdinal.get(e.ordinal)
      if (score === undefined)
        throw new Error(`No analysis score for employee ordinal ${e.ordinal}`)
      const nullableSalary = (value) =>
        value === null || value === undefined
          ? 'NULL'
          : num(Number(value).toFixed(2))
      return (
        `  (${escStr(empId)}, ${escStr(SAL_REPORT_ID)}, ${num(e.ordinal)}, ` +
        `${escStr(e.education)}, ${escStr(e.field)}, ${escStr(e.department)}, ` +
        `${escStr(e.startDate)}, ${num(e.workRatio)}, ` +
        `${num(Number(e.baseSalary).toFixed(2))}, ` +
        `${nullableSalary(e.additionalFixedOvertime)}, ${nullableSalary(e.additionalFixedCarAllowance)}, ` +
        `${nullableSalary(e.bonusOccasionalCarAllowance)}, ${nullableSalary(e.bonusOccasionalOvertime)}, ` +
        `${nullableSalary(e.bonusPayments)}, ${nullableSalary(e.bonusOther)}, ` +
        `${escStr(e.gender)}, ${escStr(roleId)}, ${num(Number(score).toFixed(2))})`
      )
    })
    .join(',\n')

  const personalValues = []
  excel.employees.forEach((e) => {
    const empId = empIdByOrdinal.get(e.ordinal)
    e.personalStepAssignments.forEach((psa) => {
      const stepId = stepIdByKey.get(
        `${psa.criterionTitle}|${psa.subTitle}|${psa.stepOrder}`,
      )
      if (!stepId) {
        throw new Error(
          `Missing step for employee ${e.ordinal} personal assignment ${psa.criterionTitle}/${psa.subTitle}/${psa.stepOrder}`,
        )
      }
      personalValues.push(
        `  (${escStr(newUid())}, ${escStr(empId)}, ${escStr(stepId)})`,
      )
    })
  })

  return `
BEGIN;

INSERT INTO report_employee (id, report_id, ordinal, education, field, department,
  start_date, work_ratio, base_salary,
  additional_fixed_overtime, additional_fixed_car_allowance,
  bonus_occasional_car_allowance, bonus_occasional_overtime, bonus_payments, bonus_other,
  gender, report_employee_role_id, score) VALUES
${empValues};

INSERT INTO report_employee_personal_criterion_step (id, report_employee_id, report_sub_criterion_step_id) VALUES
${personalValues.join(',\n')};

COMMIT;
  `
}

// 7. report_result + per-role results ---------------------------------------
function resultSql() {
  const resultId = newUid()
  const agg = analysis.baseSalaryByGenderAndScoreAll

  const baseSnapshot = {
    genderPayGap: agg.totals.wageGapPercent,
    maleCount: agg.totals.maleCount,
    femaleCount: agg.totals.femaleCount,
    overallAverageSalary: agg.totals.overallAverageSalary,
  }

  const fullSnapshot = {
    baseSalaryByGenderAndScoreAll: agg,
    employeeCount: excel.employees.length,
    roleCount: excel.roles.length,
  }

  const outlierSnapshot = {
    employees: analysis.outliers,
  }

  const empsByRole = new Map()
  excel.employees.forEach((e) => {
    if (!empsByRole.has(e.roleTitle)) empsByRole.set(e.roleTitle, [])
    empsByRole.get(e.roleTitle).push(e)
  })

  const round = (n) => Math.round(n)
  const roleResultRows = excel.roles.map((r) => {
    const emps = empsByRole.get(r.title) || []
    const males = emps.filter((e) => e.gender === 'MALE')
    const females = emps.filter((e) => e.gender === 'FEMALE')
    const avg = (arr) =>
      arr.length === 0
        ? 0
        : arr.reduce((s, e) => s + Number(e.baseSalary) / e.workRatio, 0) /
          arr.length
    const maleAvg = avg(males)
    const femaleAvg = avg(females)
    const wageGap =
      maleAvg && femaleAvg
        ? Math.round(((maleAvg - femaleAvg) / maleAvg) * 1000) / 10
        : 0
    const base = {
      genderPayGap: wageGap,
      maleCount: males.length,
      femaleCount: females.length,
    }
    const full = {
      ...base,
      employeeCount: emps.length,
      maleAverageSalary: round(maleAvg),
      femaleAverageSalary: round(femaleAvg),
    }
    return {
      id: newUid(),
      roleId: roleIdByTitle.get(r.title),
      title: r.title,
      base,
      full,
    }
  })

  const roleResultValues = roleResultRows
    .map(
      (rr) =>
        `  (${escStr(rr.id)}, ${escStr(resultId)}, ${escStr(rr.roleId)}, ${escStr(rr.title)}, ${escJson(
          rr.base,
        )}, ${escJson(rr.full)})`,
    )
    .join(',\n')

  return `
BEGIN;

INSERT INTO report_result (id, report_id, salary_difference_threshold_percent,
  calculation_version, base_snapshot, full_snapshot, outlier_analysis_snapshot)
VALUES (${escStr(resultId)}, ${escStr(SAL_REPORT_ID)}, 1.95, 'v1',
  ${escJson(baseSnapshot)}, ${escJson(fullSnapshot)}, ${escJson(outlierSnapshot)});

INSERT INTO report_role_result (id, report_result_id, report_employee_role_id, role_title, base_snapshot, full_snapshot) VALUES
${roleResultValues};

COMMIT;
  `
}

// 8. Outliers split across THREE explained groups ---------------------------
// Each outlier is a thin join referencing its group_id. We create three
// explained groups (all four explanation fields populated) and distribute the
// flagged outliers round-robin so every group gets a spread of deviations.
function outliersSql() {
  const filtered = analysis.outliers.filter(
    (o) => Math.abs(o.differencePercent) >= 32,
  )

  const groups = [
    {
      id: newUid(),
      name: 'Stjórnendur',
      reason: 'Stjórnunarábyrgð og umfang starfs réttlætir hærri grunnlaun.',
      action: 'Yfirfarið við næstu launaviðræður stjórnenda.',
      signatureName: 'Þóra Þórsdóttir',
      signatureRole: 'Framkvæmdastjóri',
    },
    {
      id: newUid(),
      name: 'Sérfræðingar',
      reason: 'Eftirsótt sérþekking og markaðsaðstæður á sérfræðisviði.',
      action: 'Markaðsgreining launa gerð á næsta ársfjórðungi.',
      signatureName: 'Jón Jónsson',
      signatureRole: 'Mannauðsstjóri',
    },
    {
      id: newUid(),
      name: 'Reynslumiklir starfsmenn',
      reason: 'Löng starfsreynsla og tryggð við fyrirtækið.',
      action: 'Starfsþróunarsamtöl bókuð fyrir árslok.',
      signatureName: 'Anna Annadóttir',
      signatureRole: 'Deildarstjóri',
    },
  ]

  const groupValues = groups.map(
    (g) =>
      `  (${escStr(g.id)}, ${escStr(SAL_REPORT_ID)}, ${escStr(g.name)}, ${escStr(
        g.reason,
      )}, ${escStr(g.action)}, ${escStr(g.signatureName)}, ${escStr(g.signatureRole)})`,
  )

  const outlierValues = filtered.map((o, i) => {
    const empId = empIdByOrdinal.get(o.employeeOrdinal)
    if (!empId)
      throw new Error(`Outlier references unknown ordinal ${o.employeeOrdinal}`)
    const groupId = groups[i % groups.length].id
    return `  (${escStr(newUid())}, ${escStr(empId)}, ${escStr(groupId)})`
  })

  return `
BEGIN;

INSERT INTO report_outlier_group (id, report_id, name, reason, action, signature_name, signature_role) VALUES
${groupValues.join(',\n')};

INSERT INTO report_employee_outlier (id, report_employee_id, group_id) VALUES
${outlierValues.join(',\n')};

COMMIT;
  `
}

// 9. Events: SUBMITTED + STATUS_CHANGED to IN_REVIEW ------------------------
function eventsSql() {
  const evSubmitted = newUid()
  const evInReview = newUid()
  return `
BEGIN;

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES (${escStr(evSubmitted)}, ${escStr(SAL_REPORT_ID)}, 'SUBMITTED', NULL, 'SUBMITTED', ${escStr(COMPANY_ID)});

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES (${escStr(evInReview)}, ${escStr(SAL_REPORT_ID)}, 'STATUS_CHANGED', ${escStr(REVIEWER_ID)}, 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', ${escStr(COMPANY_ID)});

COMMIT;
  `
}

// 10. Down: scoped to this scenario's company only --------------------------
function downSql() {
  return `
BEGIN;

DELETE FROM report_comment      WHERE report_id IN (${escStr(SAL_REPORT_ID)}, ${escStr(EQ_REPORT_ID)});
DELETE FROM report_event        WHERE company_id = ${escStr(COMPANY_ID)};
DELETE FROM report_employee_personal_criterion_step
  WHERE report_employee_id IN (SELECT id FROM report_employee WHERE report_id = ${escStr(SAL_REPORT_ID)});
DELETE FROM report_employee_outlier
  WHERE report_employee_id IN (SELECT id FROM report_employee WHERE report_id = ${escStr(SAL_REPORT_ID)});
DELETE FROM report_outlier_group WHERE report_id = ${escStr(SAL_REPORT_ID)};
DELETE FROM report_employee_role_criterion_step
  WHERE report_sub_criterion_step_id IN (
    SELECT rscs.id FROM report_sub_criterion_step rscs
    JOIN report_sub_criterion rsc ON rsc.id = rscs.report_sub_criterion_id
    JOIN report_criterion rc ON rc.id = rsc.report_criterion_id
    WHERE rc.report_id = ${escStr(SAL_REPORT_ID)}
  );
DELETE FROM report_employee     WHERE report_id = ${escStr(SAL_REPORT_ID)};
DELETE FROM report_role_result
  WHERE report_result_id IN (SELECT id FROM report_result WHERE report_id = ${escStr(SAL_REPORT_ID)});
DELETE FROM report_employee_role
  WHERE id IN (${[...roleIdByTitle.values()].map((id) => escStr(id)).join(', ')});
DELETE FROM report_result       WHERE report_id = ${escStr(SAL_REPORT_ID)};
DELETE FROM report_sub_criterion_step
  WHERE report_sub_criterion_id IN (
    SELECT rsc.id FROM report_sub_criterion rsc
    JOIN report_criterion rc ON rc.id = rsc.report_criterion_id
    WHERE rc.report_id = ${escStr(SAL_REPORT_ID)}
  );
DELETE FROM report_sub_criterion
  WHERE report_criterion_id IN (SELECT id FROM report_criterion WHERE report_id = ${escStr(SAL_REPORT_ID)});
DELETE FROM report_criterion    WHERE report_id = ${escStr(SAL_REPORT_ID)};
DELETE FROM company_report      WHERE company_id = ${escStr(COMPANY_ID)};
DELETE FROM report              WHERE id IN (${escStr(SAL_REPORT_ID)}, ${escStr(EQ_REPORT_ID)});
DELETE FROM company             WHERE id = ${escStr(COMPANY_ID)};

COMMIT;
  `
}
