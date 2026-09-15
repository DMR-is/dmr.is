'use strict'

/**
 * A company that a payroll vendor can file for through the partner API, without
 * building anything first.
 *
 * ## Why this exists
 *
 * Filing a salary report on that surface needs two things the vendor does not
 * supply: an **approved equality report** still in force, and a **complete
 * scoring model** to score against. Assembling the second by hand takes roughly
 * fifteen calls — create the model, four criteria, four sub-criteria, four
 * scales, a job, its assignments — and every one of them has to be threaded
 * through ids returned by the last. That cost is why the submission path had
 * never been exercised end to end: every manual pass ran out of patience at the
 * preview, and the defects that round found were found by reading rather than
 * by running.
 *
 * So this seeds both halves. After `dev-init`, issue a key for
 * **Starfsmatsfyrirtækið hf.** from the *aðgangslyklar* tab and the whole flow
 * is two calls:
 *
 *   GET  /api/v1/partner/scoring-models            → the model id
 *   POST /api/v1/partner/reports/salary            → { providerId, scoringModelId, employees[] }
 *
 * ## The model
 *
 * Deliberately the smallest one that reads `VALID`: one criterion of each of the
 * four mandatory job-based types, one sub-criterion under each at 25% so the
 * model-wide total is 100, a three-þrep scale on each, and one job assigned
 * across all four. Nothing here is a demonstration of range — it is the floor,
 * so that a tester who breaks it learns what the validator says about *their*
 * change rather than about seeded complexity.
 *
 * No `PERSONAL` criterion, and that is the point rather than an omission: a
 * model without one lets `employees[].personalSteps` be `[]`, so a first
 * end-to-end run needs no judgement data at all. Add one through the API when
 * testing the part a vendor cannot derive.
 *
 * ## Slot
 *
 * Company slot 31 — after seed-doe-scenarios (1–28), seed-doe-rich-scenario (29)
 * and seed-doe-three-group-outliers (30). Auxiliary ids live above 31000, so
 * `db:seed:all` runs this alongside the others and `down()` is scoped to this
 * company alone.
 */

// Reviewer from the initial seed, as the other DoE seeders use.
const REVIEWER_ID = 'b4e98cee-a4d8-4924-90df-b820c4bc0801'

// Valid v4 shape (version 4, variant 8) so the ids pass the strict UUID
// validation every scoring-model route applies to its path parameters.
const cid = (n) =>
  `c${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`
const eid = (n) =>
  `e${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`
const uid = (n) =>
  `f${String(n).padStart(7, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`

const N = 31
const COMPANY_ID = cid(N)
const EQ_REPORT_ID = eid(N)
const NATIONAL_ID = '5001010031'
const COMPANY_NAME = 'Starfsmatsfyrirtækið hf.'

// A fixed id so the model can be named in documentation and in a test run
// without looking it up first.
const SCORING_MODEL_ID = 'd0000031-0000-4000-8000-000000000031'

let nextUid = 31000
const newUid = () => uid(nextUid++)

const escStr = (s) => `'${String(s).replace(/'/g, "''")}'`

/**
 * The four mandatory job-based types, one criterion each.
 *
 * Titles are the Directorate's own vocabulary rather than the enum names — a
 * model titled `RESPONSIBILITY` would be legal and would also teach a reader
 * that the type is the title, which it is not.
 */
const CRITERIA = [
  { type: 'RESPONSIBILITY', title: 'Ábyrgð', sub: 'Mannaforráð' },
  { type: 'STRAIN', title: 'Álag', sub: 'Vinnuálag' },
  { type: 'CONDITION', title: 'Vinnuaðstæður', sub: 'Vinnuumhverfi' },
  { type: 'COMPETENCE', title: 'Hæfni', sub: 'Þekking og reynsla' },
]

const STEPS = ['Lítið', 'Miðlungs', 'Mikið']

const ROLE_TITLE = 'Sérfræðingur'

function companySql() {
  return `
BEGIN;
-- ON CONFLICT for the same reason the sibling seeders carry it: company
-- survives the TRUNCATE report CASCADE in m-20260820-report-employee-paid-hours
-- and no seederStorage is configured, so db:seed:all re-runs this every
-- dev-init.
INSERT INTO company (id, name, national_id, employee_count_category, salary_report_required_override)
VALUES (${escStr(COMPANY_ID)}, ${escStr(COMPANY_NAME)}, ${escStr(NATIONAL_ID)}, 'LARGE', FALSE)
ON CONFLICT (id) DO NOTHING;
COMMIT;
  `
}

/**
 * APPROVED and three years in force, so `resolveActiveEqualityReportId` finds it
 * and the salary submission gets past its precondition. Without this the
 * partner flow stops at a 404 that says nothing about the code under test.
 */
function equalityReportSql() {
  const companyReportId = newUid()
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
  'Sigrún Sigurðardóttir', 'sigrun@starfsmat.is', 'FEMALE',
  'Sigrún Sigurðardóttir', 'sigrun@starfsmat.is', '555-0031',
  'ISLAND_IS', 'prov-eq-031', 'JR-2026-031',
  'Jafnréttisáætlun Starfsmatsfyrirtækisins 2026–2029.',
  ${escStr(REVIEWER_ID)},
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days' + INTERVAL '3 years');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES (${escStr(companyReportId)}, ${escStr(COMPANY_ID)}, ${escStr(EQ_REPORT_ID)}, NULL,
  ${escStr(COMPANY_NAME)}, ${escStr(NATIONAL_ID)}, 'Borgartún 31', 'Reykjavík', '105', 'LARGE', 'M');

-- report_event_type_enum has no APPROVED member: event_type says what kind of
-- thing happened, and report_status carries the status it moved to. A
-- STATUS_CHANGED row additionally has to satisfy report_event_status_changed_chk
-- — from_status and to_status both set, and report_status equal to to_status —
-- so the transition is stated rather than implied.
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, assigned_user_id, company_id)
VALUES (${escStr(evSubmitted)}, ${escStr(EQ_REPORT_ID)}, 'SUBMITTED', NULL, 'SUBMITTED',
  NULL, NULL, NULL, ${escStr(COMPANY_ID)}),
  (${escStr(evInReview)}, ${escStr(EQ_REPORT_ID)}, 'STATUS_CHANGED', ${escStr(REVIEWER_ID)}, 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', NULL, ${escStr(COMPANY_ID)}),
  (${escStr(evApproved)}, ${escStr(EQ_REPORT_ID)}, 'STATUS_CHANGED', ${escStr(REVIEWER_ID)}, 'APPROVED',
  'IN_REVIEW', 'APPROVED', NULL, ${escStr(COMPANY_ID)});

COMMIT;
  `
}

/**
 * The scoring model itself.
 *
 * Note what is NOT written: `scoring_criterion` has no weight column and
 * `scoring_sub_criterion_step` has no score column. Both are derived — the
 * criterion's weight from the sum of its sub-criteria, the þrep's score from
 * its position over the scale's length — so a seeder that wrote them would be
 * asserting values the API would ignore.
 */
function scoringModelSql() {
  const criterionIds = CRITERIA.map(() => newUid())
  const subIds = CRITERIA.map(() => newUid())
  const stepIds = CRITERIA.map(() => STEPS.map(() => newUid()))
  const roleId = newUid()

  const criterionRows = CRITERIA.map(
    (c, i) =>
      `  (${escStr(criterionIds[i])}, ${escStr(SCORING_MODEL_ID)}, '${c.type}', ${escStr(c.title)}, ${escStr(`${c.title} starfsmatsins`)})`,
  ).join(',\n')

  // 25 each, so the model-wide total is exactly 100 — the rule is a sum across
  // the whole model, not per criterion.
  const subRows = CRITERIA.map(
    (c, i) =>
      `  (${escStr(subIds[i])}, ${escStr(criterionIds[i])}, ${escStr(c.sub)}, ${escStr(`${c.sub} — mat á ${c.title.toLowerCase()}`)}, 25)`,
  ).join(',\n')

  const stepRows = CRITERIA.flatMap((_, i) =>
    STEPS.map(
      (label, s) =>
        `  (${escStr(stepIds[i][s])}, ${escStr(subIds[i])}, ${s + 1}, ${escStr(label)})`,
    ),
  ).join(',\n')

  // Þrep 2 of 3 on every sub-criterion: a mid-scale job, so an employee's total
  // is 4 x (2/3 x 25 x 10) = 666.67 and a tester can recognise the number.
  const assignmentRows = CRITERIA.map(
    (_, i) =>
      `  (${escStr(newUid())}, ${escStr(roleId)}, ${escStr(subIds[i])}, ${escStr(stepIds[i][1])})`,
  ).join(',\n')

  return `
BEGIN;

INSERT INTO scoring_model (id, company_id, name)
VALUES (${escStr(SCORING_MODEL_ID)}, ${escStr(COMPANY_ID)}, 'Starfsmat 2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO scoring_criterion (id, scoring_model_id, type, title, description)
VALUES
${criterionRows};

INSERT INTO scoring_sub_criterion (id, scoring_criterion_id, title, description, weight)
VALUES
${subRows};

INSERT INTO scoring_sub_criterion_step (id, scoring_sub_criterion_id, step_order, description)
VALUES
${stepRows};

INSERT INTO scoring_role (id, scoring_model_id, title)
VALUES (${escStr(roleId)}, ${escStr(SCORING_MODEL_ID)}, ${escStr(ROLE_TITLE)});

INSERT INTO scoring_role_step (id, scoring_role_id, scoring_sub_criterion_id, scoring_sub_criterion_step_id)
VALUES
${assignmentRows};

COMMIT;
  `
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(companySql())
    await queryInterface.sequelize.query(equalityReportSql())
    await queryInterface.sequelize.query(scoringModelSql())
  },

  async down(queryInterface) {
    // The scoring tables cascade from `scoring_model`, so one delete takes the
    // criteria, sub-criteria, þrep, jobs and assignments with it. The report
    // graph has no cascade anywhere, so those go children-first.
    await queryInterface.sequelize.query(`
BEGIN;

DELETE FROM scoring_model WHERE id = ${escStr(SCORING_MODEL_ID)};

DELETE FROM report_event WHERE report_id = ${escStr(EQ_REPORT_ID)};
DELETE FROM company_report WHERE report_id = ${escStr(EQ_REPORT_ID)};
DELETE FROM report WHERE id = ${escStr(EQ_REPORT_ID)};
DELETE FROM company WHERE id = ${escStr(COMPANY_ID)};

COMMIT;
    `)
  },
}
