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
 *
 * Guarded throughout: `db:seed:all` has no seederStorage configured, so it
 * re-runs every seeder on every dev-init, and this block runs before the
 * scoring model. Unguarded, its duplicate key aborted the seeder here and the
 * model below was never reached at all.
 */
function equalityReportSql() {
  // Fixed for the same reason the scoring ids are: a guard keyed on `id` only
  // suppresses a re-run if the re-run computes the same id.
  const companyReportId = uid(31000)
  const evSubmitted = uid(31001)
  const evInReview = uid(31002)
  const evApproved = uid(31003)

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
  NOW() - INTERVAL '30 days' + INTERVAL '3 years')
ON CONFLICT (id) DO NOTHING;

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES (${escStr(companyReportId)}, ${escStr(COMPANY_ID)}, ${escStr(EQ_REPORT_ID)}, NULL,
  ${escStr(COMPANY_NAME)}, ${escStr(NATIONAL_ID)}, 'Borgartún 31', 'Reykjavík', '105', 'LARGE', 'M')
ON CONFLICT (id) DO NOTHING;

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
  'IN_REVIEW', 'APPROVED', NULL, ${escStr(COMPANY_ID)})
ON CONFLICT (id) DO NOTHING;

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
  // Fixed, not minted from the running counter: `newUid()` hands out a fresh id
  // on every call, so a second run would insert the same rows under different
  // primary keys and `ON CONFLICT (id)` would never fire. The guard only means
  // anything if the id a re-run computes is the id already in the table.
  const criterionIds = CRITERIA.map((_, i) => uid(31100 + i))
  const subIds = CRITERIA.map((_, i) => uid(31200 + i))
  const stepIds = CRITERIA.map((_, i) => STEPS.map((_, s) => uid(31300 + i * 10 + s)))
  const roleId = uid(31400)

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
      `  (${escStr(uid(31500 + i))}, ${escStr(roleId)}, ${escStr(subIds[i])}, ${escStr(stepIds[i][1])})`,
  ).join(',\n')

  return `
BEGIN;

-- Every insert in this block is guarded, not just the root. db:seed:all re-runs
-- this on each dev-init and the ids are all fixed, so an unguarded child would
-- raise a duplicate-key on the second run — and because these three statements
-- run as three separate queries, the failure would abort only the third, leaving
-- the company and its equality report behind and the model half-built. Guarding
-- the root alone made that outcome the *normal* one: ON CONFLICT DO NOTHING
-- skipped the root and then the children collided.
INSERT INTO scoring_model (id, company_id, name)
VALUES (${escStr(SCORING_MODEL_ID)}, ${escStr(COMPANY_ID)}, 'Starfsmat 2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO scoring_criterion (id, scoring_model_id, type, title, description)
VALUES
${criterionRows}
ON CONFLICT (id) DO NOTHING;

INSERT INTO scoring_sub_criterion (id, scoring_criterion_id, title, description, weight)
VALUES
${subRows}
ON CONFLICT (id) DO NOTHING;

INSERT INTO scoring_sub_criterion_step (id, scoring_sub_criterion_id, step_order, description)
VALUES
${stepRows}
ON CONFLICT (id) DO NOTHING;

INSERT INTO scoring_role (id, scoring_model_id, title)
VALUES (${escStr(roleId)}, ${escStr(SCORING_MODEL_ID)}, ${escStr(ROLE_TITLE)})
ON CONFLICT (id) DO NOTHING;

INSERT INTO scoring_role_step (id, scoring_role_id, scoring_sub_criterion_id, scoring_sub_criterion_step_id)
VALUES
${assignmentRows}
ON CONFLICT (id) DO NOTHING;

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
