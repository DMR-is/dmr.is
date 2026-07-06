'use strict'

const fs = require('fs')
const path = require('path')

// Reviewer from initial seed (matches seed-doe-scenarios.js)
const REVIEWER_ID = 'b4e98cee-a4d8-4924-90df-b820c4bc0801'

// UUID helpers (same shape as seed-doe-scenarios.js so id ranges are distinct)
const cid = (n) =>
  `c${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`
const eid = (n) =>
  `e${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`
const sid = (n) =>
  `b${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`
const uid = (n) =>
  `f${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`

// New company slot — does not collide with seed-doe-scenarios.js (1–28).
const RICH_N = 29
const RICH_CID = cid(RICH_N)
const RICH_EQ = eid(RICH_N)
const RICH_SAL = sid(RICH_N)
const RICH_NATIONAL_ID = '5001010029'
const RICH_COMPANY_NAME = 'Stóra Prófarasamsteypan hf.'

// Auxiliary id counter; all uid() values for this seeder live above 20000
// so they don't intersect with seed-doe-scenarios.js.
let nextUid = 20000
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
VALUES (${escStr(RICH_CID)}, ${escStr(RICH_COMPANY_NAME)}, ${escStr(RICH_NATIONAL_ID)}, 'LARGE', FALSE);
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
VALUES (${escStr(RICH_EQ)}, 'EQUALITY', 'APPROVED', ${escStr(RICH_NATIONAL_ID)},
  'Sigrún Sigrúnardóttir', 'sigrun@storaprofunin.is', 'FEMALE',
  'Sigrún Sigrúnardóttir', 'sigrun@storaprofunin.is', '999-9999',
  'ISLAND_IS', 'prov-eq-029', 'JR-2026-029',
  'Jafnréttisáætlun Stóru Prófarasamsteypunnar 2026–2029. Heildstæð áætlun með gagnsæjum launum og hlutlægum ráðningarferlum.',
  ${escStr(REVIEWER_ID)},
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days' + INTERVAL '3 years');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES (${escStr(eqCompanyReportId)}, ${escStr(RICH_CID)}, ${escStr(RICH_EQ)}, NULL,
  ${escStr(RICH_COMPANY_NAME)}, ${escStr(RICH_NATIONAL_ID)}, 'Borgartún 29', 'Reykjavík', '105', 'LARGE', 'M');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES (${escStr(evSubmitted)}, ${escStr(RICH_EQ)}, 'SUBMITTED', NULL, 'SUBMITTED', ${escStr(RICH_CID)});
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES (${escStr(evInReview)}, ${escStr(RICH_EQ)}, 'STATUS_CHANGED', ${escStr(REVIEWER_ID)}, 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', ${escStr(RICH_CID)});
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES (${escStr(evApproved)}, ${escStr(RICH_EQ)}, 'STATUS_CHANGED', ${escStr(REVIEWER_ID)}, 'APPROVED',
  'IN_REVIEW', 'APPROVED', ${escStr(RICH_CID)});

COMMIT;
  `
}

// 3. Salary report row + company_report snapshot ----------------------------
function salaryReportSql() {
  const salCompanyReportId = newUid()
  // Average employee counts by gender, derived from the 100-employee sheet.
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
VALUES (${escStr(RICH_SAL)}, 'SALARY', 'IN_REVIEW', ${escStr(RICH_NATIONAL_ID)},
  'Sigrún Sigrúnardóttir', 'sigrun@storaprofunin.is', 'FEMALE',
  'Sigrún Sigrúnardóttir', 'sigrun@storaprofunin.is', '999-9999',
  'ISLAND_IS', 'prov-sal-029', 'LS-2026-029',
  ${escStr(RICH_EQ)},
  ${num(male)}, ${num(female)}, ${num(neutral)},
  TRUE,
  ${escStr(REVIEWER_ID)});

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES (${escStr(salCompanyReportId)}, ${escStr(RICH_CID)}, ${escStr(RICH_SAL)}, NULL,
  ${escStr(RICH_COMPANY_NAME)}, ${escStr(RICH_NATIONAL_ID)}, 'Borgartún 29', 'Reykjavík', '105', 'LARGE', 'M');

COMMIT;
  `
}

// 4. Criteria + sub-criteria + steps ---------------------------------------
function criteriaSql() {
  const critValues = excel.criteria
    .map(
      (c, i) =>
        `  (${escStr(criterionIds[i])}, ${escStr(RICH_SAL)}, ${escStr(c.title)}, ${num(
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
    .map(
      (r) =>
        `  (${escStr(roleIdByTitle.get(r.title))}, ${escStr(RICH_SAL)}, ${escStr(r.title)})`,
    )
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

INSERT INTO report_employee_role (id, report_id, title) VALUES
${roleValues};

INSERT INTO report_employee_role_criterion_step (id, report_employee_role_id, report_sub_criterion_step_id) VALUES
${assignmentValues.join(',\n')};

COMMIT;
  `
}

// 6. Employees + personal step assignments ----------------------------------
function employeesSql() {
  // Scores from analysis.dataPoints (ordered by employee ordinal).
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
        `  (${escStr(empId)}, ${escStr(RICH_SAL)}, ${num(e.ordinal)}, ` +
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

  // Per-role aggregates derived from the 100-employee sheet.
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
VALUES (${escStr(resultId)}, ${escStr(RICH_SAL)}, 1.95, 'v1',
  ${escJson(baseSnapshot)}, ${escJson(fullSnapshot)}, ${escJson(outlierSnapshot)});

INSERT INTO report_role_result (id, report_result_id, report_employee_role_id, role_title, base_snapshot, full_snapshot) VALUES
${roleResultValues};

COMMIT;
  `
}

// 8. Outliers (~20 rows, |differencePercent| >= 32) ------------------------
// The explanation (reason / action / signature) now lives on an outlier
// group; each outlier is a thin join referencing its group_id. We create two
// groups: one "explained" (all four fields populated) and one "unexplained"
// (all four NULL) — both satisfy the group CHECK and exercise both UI branches.
function outliersSql() {
  const filtered = analysis.outliers.filter(
    (o) => Math.abs(o.differencePercent) >= 32,
  )

  // Roughly the first third go in the explained group; the rest unexplained.
  const explainedCutoff = Math.ceil(filtered.length / 3)

  const explainedGroupId = newUid()
  const unexplainedGroupId = newUid()

  const groupValues = [
    `  (${escStr(explainedGroupId)}, ${escStr(RICH_SAL)}, ${escStr(
      'Útskýrður hópur',
    )}, ${escStr(
      'Sérfræðiþekking og reynsla starfsmanns réttlætir frávikið.',
    )}, ${escStr('Endurmat við næstu launaviðræður.')}, ${escStr(
      'Sigrún Sigrúnardóttir',
    )}, ${escStr('Framkvæmdastjóri')})`,
    `  (${escStr(unexplainedGroupId)}, ${escStr(RICH_SAL)}, ${escStr(
      'Óútskýrður hópur',
    )}, NULL, NULL, NULL, NULL)`,
  ]

  const outlierValues = filtered.map((o, i) => {
    const empId = empIdByOrdinal.get(o.employeeOrdinal)
    if (!empId)
      throw new Error(`Outlier references unknown ordinal ${o.employeeOrdinal}`)
    const groupId = i < explainedCutoff ? explainedGroupId : unexplainedGroupId
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
  const commentId = newUid()
  return `
BEGIN;

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES (${escStr(evSubmitted)}, ${escStr(RICH_SAL)}, 'SUBMITTED', NULL, 'SUBMITTED', ${escStr(RICH_CID)});

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES (${escStr(evInReview)}, ${escStr(RICH_SAL)}, 'STATUS_CHANGED', ${escStr(REVIEWER_ID)}, 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', ${escStr(RICH_CID)});

INSERT INTO report_comment (id, report_id, author_kind, author_user_id, visibility, body, report_status)
VALUES (${escStr(commentId)}, ${escStr(RICH_SAL)}, 'REVIEWER', ${escStr(REVIEWER_ID)}, 'EXTERNAL',
  'Fjöldi útlaga er hár — vinsamlegast yfirfarið skýringar á efstu launakeppendum og tryggið að rökstuðningur sé fullnægjandi.',
  'IN_REVIEW');

COMMIT;
  `
}

// 10. Down: scoped to the rich-scenario company only ------------------------
function downSql() {
  return `
BEGIN;

DELETE FROM report_comment      WHERE report_id IN (${escStr(RICH_SAL)}, ${escStr(RICH_EQ)});
DELETE FROM report_event        WHERE company_id = ${escStr(RICH_CID)};
DELETE FROM report_employee_personal_criterion_step
  WHERE report_employee_id IN (SELECT id FROM report_employee WHERE report_id = ${escStr(RICH_SAL)});
DELETE FROM report_employee_outlier
  WHERE report_employee_id IN (SELECT id FROM report_employee WHERE report_id = ${escStr(RICH_SAL)});
DELETE FROM report_outlier_group WHERE report_id = ${escStr(RICH_SAL)};
DELETE FROM report_employee_role_criterion_step
  WHERE report_sub_criterion_step_id IN (
    SELECT rscs.id FROM report_sub_criterion_step rscs
    JOIN report_sub_criterion rsc ON rsc.id = rscs.report_sub_criterion_id
    JOIN report_criterion rc ON rc.id = rsc.report_criterion_id
    WHERE rc.report_id = ${escStr(RICH_SAL)}
  );
DELETE FROM report_employee     WHERE report_id = ${escStr(RICH_SAL)};
DELETE FROM report_role_result
  WHERE report_result_id IN (SELECT id FROM report_result WHERE report_id = ${escStr(RICH_SAL)});
DELETE FROM report_employee_role
  WHERE id IN (${[...roleIdByTitle.values()].map((id) => escStr(id)).join(', ')});
DELETE FROM report_result       WHERE report_id = ${escStr(RICH_SAL)};
DELETE FROM report_sub_criterion_step
  WHERE report_sub_criterion_id IN (
    SELECT rsc.id FROM report_sub_criterion rsc
    JOIN report_criterion rc ON rc.id = rsc.report_criterion_id
    WHERE rc.report_id = ${escStr(RICH_SAL)}
  );
DELETE FROM report_sub_criterion
  WHERE report_criterion_id IN (SELECT id FROM report_criterion WHERE report_id = ${escStr(RICH_SAL)});
DELETE FROM report_criterion    WHERE report_id = ${escStr(RICH_SAL)};
DELETE FROM company_report      WHERE company_id = ${escStr(RICH_CID)};
DELETE FROM report              WHERE id IN (${escStr(RICH_SAL)}, ${escStr(RICH_EQ)});
DELETE FROM company             WHERE id = ${escStr(RICH_CID)};

COMMIT;
  `
}
