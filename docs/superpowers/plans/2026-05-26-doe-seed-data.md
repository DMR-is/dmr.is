# DOE Seed Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a comprehensive Sequelize seeder that populates 28 companies with full report data covering every status combination the DOE system can represent.

**Architecture:** A single new Sequelize seeder file (`20260526-doe-scenario-seed.js`) that runs after the existing initial seed. It inserts all data in one transaction using raw SQL via `queryInterface.sequelize.query()`. The `down()` function deletes all seeded rows by their deterministic UUIDs. Salary reports that need employee/outlier data share a common set of criteria/roles defined once at the top of the seed, then referenced by all salary report scenarios.

**Tech Stack:** Sequelize CLI seeder (`.js`), raw PostgreSQL, `uuid-ossp` extension already enabled.

---

## UUID Constants Reference

All UUIDs are deterministic so `down()` can delete by ID. Use this naming scheme throughout:

```
REVIEWER_USER_ID = 'b4e98cee-a4d8-4924-90df-b820c4bc0801'  (existing user)

Companies:  c0000001-0000-0000-0000-000000000001 through ...0028
Reports:    r0000001-... equality reports, r1000001-... salary reports
Roles:      role0001-... through role0003-...
Criteria:   crit0001-... through crit0002-...
Sub-crit:   scrt0001-... through scrt0002-...
Steps:      step0001-... through step0004-... (2 per sub-criterion)
Employees:  empl0001-... (reused pattern, scoped per report by ordinal)
Outliers:   outl0001-...
Results:    rslt0001-...
Events:     evnt0001-...
Comments:   cmnt0001-...
```

---

## Scenario Map

| # | Company ID suffix | Name | Size | eq status | salary status |
|---|---|---|---|---|---|
| 1 | `...0001` | Engin skil ehf. | SMALL | — | — |
| 2 | `...0002` | Drög sf. | MEDIUM | DRAFT | — |
| 3 | `...0003` | Bið og von hf. | MEDIUM | SUBMITTED | — |
| 4 | `...0004` | Í skoðun ehf. | MEDIUM | IN_REVIEW | — |
| 5 | `...0005` | Synjun sf. | MEDIUM | DENIED | — |
| 6 | `...0006` | Samþykkt lítið hf. | MEDIUM | APPROVED | — |
| 7 | `...0007` | Afturkallað og endursent ehf. | MEDIUM | WITHDRAWN + new SUBMITTED | — |
| 8 | `...0008` | Laun bíður ehf. | LARGE | APPROVED | (none yet) |
| 9 | `...0009` | Laun drög hf. | LARGE | APPROVED | DRAFT |
| 10 | `...0010` | Laun sent ehf. | LARGE | APPROVED | SUBMITTED (no outliers) |
| 11 | `...0011` | Frestun sf. | LARGE | APPROVED | POSTPONED (all outliers deferred) |
| 12 | `...0012` | Yfirfaring hf. | LARGE | APPROVED | IN_REVIEW (with outliers) |
| 13 | `...0013` | Samþykkt hreint ehf. | LARGE | APPROVED | APPROVED (no outliers) |
| 14 | `...0014` | Samþykkt útlagar hf. | LARGE | APPROVED | APPROVED (outliers explained) |
| 15 | `...0015` | Synjað laun sf. | LARGE | APPROVED | DENIED |
| 16 | `...0016` | Saga jafnréttis ehf. | LARGE | SUPERSEDED + new APPROVED | APPROVED |
| 17 | `...0017` | Saga launa hf. | LARGE | APPROVED | SUPERSEDED + new APPROVED |
| 18 | `...0018` | Undanþága ehf. | MEDIUM (override) | APPROVED | SUBMITTED |
| 19–21 | `...0019–0021` | Blank MEDIUM 1–3 | MEDIUM | — | — |
| 22–28 | `...0022–0028` | Blank LARGE 1–7 | LARGE | — | — |

---

## Shared Salary Report Structure

Every salary report in the seed uses the same criterion/role scaffold:

- **2 criteria**: Responsibility (weight 0.5), Competence (weight 0.5) — **per-report** (have `report_id` FK)
- **1 sub-criterion per criterion** (each weight 1.0) — per-report
- **2 steps per sub-criterion** (scores 0.0 and 1.0) — per-report
- **3 roles**: Verkefnastjóri, Sérfræðingur, Aðstoðarmaður — **GLOBAL** (no `report_id` on `report_employee_role`)
- Each report gets its own `report_employee_role_criterion_step` rows linking the shared global roles to its own per-report steps
- **6 employees per salary report** (2 per role, mixed genders)
- **Outlier employees**: employee ordinal 1 is always the outlier (male, significantly above predicted)

`report_employee_role` is a global lookup table (just `id` + `title`, no `report_id`). The 3 role rows are inserted ONCE in a dedicated task and reused by all salary reports via their fixed UUIDs. Per-report data = criteria, sub-criteria, steps, role-criterion-step links, employees, result rows.

---

## Task 1: Seed file skeleton + companies

**Files:**
- Create: `apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js`

- [ ] **Step 1: Create the file with module boilerplate and the 28 company INSERTs**

```js
'use strict'

// Existing reviewer (from initial seed)
const REVIEWER_ID = 'b4e98cee-a4d8-4924-90df-b820c4bc0801'

// Helper: pad a number into a UUID-shaped constant
// e.g. cid(1) => 'c0000001-0000-0000-0000-000000000001'
const cid = (n) => `c${String(n).padStart(7,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}`
const eid = (n) => `e${String(n).padStart(7,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}` // equality report
const sid = (n) => `s${String(n).padStart(7,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}` // salary report
const rid = (n) => `r${String(n).padStart(7,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}` // role
const uid = (n) => `u${String(n).padStart(7,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}` // generic (employee, outlier, result, event, comment etc)

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(companiesSql())
  },
  async down(queryInterface) {
    return await queryInterface.sequelize.query(downSql())
  },
}
```

- [ ] **Step 2: Write `companiesSql()`**

```js
function companiesSql() {
  return `
BEGIN;

INSERT INTO company (id, name, national_id, employee_count_category, salary_report_required_override)
VALUES
  -- Scenario companies
  ('${cid(1)}',  'Engin skil ehf.',                   '5001010001', 'SMALL',  FALSE),
  ('${cid(2)}',  'Drög sf.',                           '5001010002', 'MEDIUM', FALSE),
  ('${cid(3)}',  'Bið og von hf.',                     '5001010003', 'MEDIUM', FALSE),
  ('${cid(4)}',  'Í skoðun ehf.',                      '5001010004', 'MEDIUM', FALSE),
  ('${cid(5)}',  'Synjun sf.',                         '5001010005', 'MEDIUM', FALSE),
  ('${cid(6)}',  'Samþykkt lítið hf.',                 '5001010006', 'MEDIUM', FALSE),
  ('${cid(7)}',  'Afturkallað og endursent ehf.',       '5001010007', 'MEDIUM', FALSE),
  ('${cid(8)}',  'Laun bíður ehf.',                    '5001010008', 'LARGE',  FALSE),
  ('${cid(9)}',  'Laun drög hf.',                      '5001010009', 'LARGE',  FALSE),
  ('${cid(10)}', 'Laun sent ehf.',                     '5001010010', 'LARGE',  FALSE),
  ('${cid(11)}', 'Frestun sf.',                        '5001010011', 'LARGE',  FALSE),
  ('${cid(12)}', 'Yfirfaring hf.',                     '5001010012', 'LARGE',  FALSE),
  ('${cid(13)}', 'Samþykkt hreint ehf.',               '5001010013', 'LARGE',  FALSE),
  ('${cid(14)}', 'Samþykkt útlagar hf.',               '5001010014', 'LARGE',  FALSE),
  ('${cid(15)}', 'Synjað laun sf.',                    '5001010015', 'LARGE',  FALSE),
  ('${cid(16)}', 'Saga jafnréttis ehf.',               '5001010016', 'LARGE',  FALSE),
  ('${cid(17)}', 'Saga launa hf.',                     '5001010017', 'LARGE',  FALSE),
  ('${cid(18)}', 'Undanþága ehf.',                     '5001010018', 'MEDIUM', TRUE),
  -- Blank MEDIUM companies (19–21)
  ('${cid(19)}', 'Auð medium eitt ehf.',               '5001010019', 'MEDIUM', FALSE),
  ('${cid(20)}', 'Auð medium tvö sf.',                 '5001010020', 'MEDIUM', FALSE),
  ('${cid(21)}', 'Auð medium þrjú hf.',                '5001010021', 'MEDIUM', FALSE),
  -- Blank LARGE companies (22–28)
  ('${cid(22)}', 'Auð large eitt ehf.',                '5001010022', 'LARGE',  FALSE),
  ('${cid(23)}', 'Auð large tvö sf.',                  '5001010023', 'LARGE',  FALSE),
  ('${cid(24)}', 'Auð large þrjú hf.',                 '5001010024', 'LARGE',  FALSE),
  ('${cid(25)}', 'Auð large fjögur ehf.',              '5001010025', 'LARGE',  FALSE),
  ('${cid(26)}', 'Auð large fimm sf.',                 '5001010026', 'LARGE',  FALSE),
  ('${cid(27)}', 'Auð large sex hf.',                  '5001010027', 'LARGE',  FALSE),
  ('${cid(28)}', 'Auð large sjö ehf.',                 '5001010028', 'LARGE',  FALSE);

COMMIT;
  `
}
```

Note: `salary_report_required` is set automatically by the DB trigger (`LARGE` → TRUE, MEDIUM/SMALL → FALSE, unless `salary_report_required_override = TRUE`). Company 18 is MEDIUM with override=TRUE so its salary_report_required will be set to TRUE by the trigger.

- [ ] **Step 3: Write `downSql()` — deletes all seeded data in reverse FK order**

```js
function downSql() {
  const companyIds = Array.from({length: 28}, (_, i) => `'${cid(i+1)}'`).join(',\n    ')
  return `
BEGIN;

DELETE FROM report_comment      WHERE report_id IN (SELECT id FROM report WHERE company_national_id LIKE '500101%');
DELETE FROM report_event        WHERE company_id IN (${companyIds});
DELETE FROM report_employee_personal_criterion_step
  WHERE report_employee_id IN (
    SELECT re.id FROM report_employee re
    JOIN report r ON r.id = re.report_id
    WHERE r.company_national_id LIKE '500101%'
  );
DELETE FROM report_employee_outlier
  WHERE report_employee_id IN (
    SELECT re.id FROM report_employee re
    JOIN report r ON r.id = re.report_id
    WHERE r.company_national_id LIKE '500101%'
  );
DELETE FROM report_employee_role_criterion_step
  WHERE report_employee_role_id IN (
    SELECT rer.id FROM report_employee_role rer
    JOIN report r ON r.id = rer.report_id
    WHERE r.company_national_id LIKE '500101%'
  );
DELETE FROM report_employee     WHERE report_id IN (SELECT id FROM report WHERE company_national_id LIKE '500101%');
DELETE FROM report_role_result
  WHERE report_result_id IN (
    SELECT rr.id FROM report_result rr
    JOIN report r ON r.id = rr.report_id
    WHERE r.company_national_id LIKE '500101%'
  );
DELETE FROM report_result       WHERE report_id IN (SELECT id FROM report WHERE company_national_id LIKE '500101%');
DELETE FROM report_sub_criterion_step
  WHERE report_sub_criterion_id IN (
    SELECT rsc.id FROM report_sub_criterion rsc
    JOIN report_criterion rc ON rc.id = rsc.report_criterion_id
    JOIN report r ON r.id = rc.report_id
    WHERE r.company_national_id LIKE '500101%'
  );
DELETE FROM report_sub_criterion
  WHERE report_criterion_id IN (
    SELECT rc.id FROM report_criterion rc
    JOIN report r ON r.id = rc.report_id
    WHERE r.company_national_id LIKE '500101%'
  );
DELETE FROM report_criterion    WHERE report_id IN (SELECT id FROM report WHERE company_national_id LIKE '500101%');
DELETE FROM report_employee_role WHERE report_id IN (SELECT id FROM report WHERE company_national_id LIKE '500101%');
DELETE FROM company_report      WHERE company_id IN (${companyIds});
DELETE FROM report              WHERE company_national_id LIKE '500101%';
DELETE FROM company             WHERE id IN (${companyIds});

COMMIT;
  `
}
```

- [ ] **Step 4: Verify the file parses without errors**

```bash
node -e "require('./apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js')"
```

Expected: no output, no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js
git commit -m "feat(doe-seed): scaffold seeder with 28 companies"
```

---

## Task 2: Equality-only report scenarios (companies 2–7)

**Files:**
- Modify: `apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js`

Add `equalityReportsSql()` and call it from `up()`:

```js
async up(queryInterface) {
  await queryInterface.sequelize.query(companiesSql())
  await queryInterface.sequelize.query(equalityReportsSql())
},
```

- [ ] **Step 1: Write `equalityReportsSql()`**

Each equality report needs: a `report` row, a `company_report` snapshot row, and `report_event` rows for its audit trail.

```js
function equalityReportsSql() {
  // Shared contact info
  const contact = (co) => `
    company_national_id = '${co.nationalId}',
    company_admin_name  = '${co.adminName}',
    company_admin_email = '${co.adminEmail}',
    company_admin_gender = 'FEMALE',
    contact_name  = '${co.adminName}',
    contact_email = '${co.adminEmail}',
    contact_phone = '555-0001',
    provider_type = 'ISLAND_IS',
    provider_id   = '${co.providerId}',
    identifier    = '${co.identifier}'
  `
  // company_report snapshot helper
  const snap = (reportId, companyId, nationalId, name, size) => `
    ('${uid(snapCounter++)}', '${companyId}', '${reportId}', NULL,
     '${name}', '${nationalId}', 'Laugavegur 1', 'Reykjavík', '101', '${size}', 'K')
  `
  // ...
}
```

The full function is structured as one large SQL string. Below is the complete version with all 6 companies' data:

```js
let snapCounter = 1000  // offset to avoid collision with salary snapshots

function equalityReportsSql() {
  return `
BEGIN;

-- ============================================================
-- Equality reports: companies 2–7
-- ============================================================

-- Company 2: Drög sf. — equality DRAFT
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content)
VALUES ('${eid(2)}', 'EQUALITY', 'DRAFT', '5001010002',
  'Anna Sigurðardóttir', 'anna@drog.is', 'FEMALE',
  'Anna Sigurðardóttir', 'anna@drog.is', '555-0002',
  'ISLAND_IS', 'prov-eq-002', 'JR-2026-002', NULL);

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(2000)}', '${cid(2)}', '${eid(2)}', NULL,
  'Drög sf.', '5001010002', 'Hafnarfjörður 1', 'Hafnarfjörður', '220', 'MEDIUM', 'K');

-- No events for DRAFT (draft = company hasn''t submitted yet)

-- Company 3: Bið og von hf. — equality SUBMITTED
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content)
VALUES ('${eid(3)}', 'EQUALITY', 'SUBMITTED', '5001010003',
  'Björg Jónsdóttir', 'bjorg@bidogvon.is', 'FEMALE',
  'Björg Jónsdóttir', 'bjorg@bidogvon.is', '555-0003',
  'ISLAND_IS', 'prov-eq-003', 'JR-2026-003',
  'Jafnréttisáætlun okkar byggist á virðingu og jafnræði allra starfsmanna.');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(2001)}', '${cid(3)}', '${eid(3)}', NULL,
  'Bið og von hf.', '5001010003', 'Skipagata 2', 'Akureyri', '600', 'MEDIUM', 'K');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(3000)}', '${eid(3)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(3)}');

-- Company 4: Í skoðun ehf. — equality IN_REVIEW
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content,
  reviewer_user_id)
VALUES ('${eid(4)}', 'EQUALITY', 'IN_REVIEW', '5001010004',
  'Dagný Kristjánsdóttir', 'dagny@iskodunum.is', 'FEMALE',
  'Dagný Kristjánsdóttir', 'dagny@iskodunum.is', '555-0004',
  'ISLAND_IS', 'prov-eq-004', 'JR-2026-004',
  'Við leggjum áherslu á jafna meðferð kynjanna í öllum málum.',
  '${REVIEWER_ID}');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(2002)}', '${cid(4)}', '${eid(4)}', NULL,
  'Í skoðun ehf.', '5001010004', 'Austurstræti 3', 'Reykjavík', '101', 'MEDIUM', 'K');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(3001)}', '${eid(4)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(4)}');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(3002)}', '${eid(4)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(4)}');

INSERT INTO report_comment (id, report_id, author_kind, author_user_id, visibility, body, report_status)
VALUES ('${uid(4000)}', '${eid(4)}', 'REVIEWER', '${REVIEWER_ID}', 'EXTERNAL',
  'Getið þið útskýrt nánar hvernig þið meðhöndlið laun í foreldraorlofi?', 'IN_REVIEW');

-- Company 5: Synjun sf. — equality DENIED
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content,
  reviewer_user_id)
VALUES ('${eid(5)}', 'EQUALITY', 'DENIED', '5001010005',
  'Eva Magnúsdóttir', 'eva@synjun.is', 'FEMALE',
  'Eva Magnúsdóttir', 'eva@synjun.is', '555-0005',
  'ISLAND_IS', 'prov-eq-005', 'JR-2026-005',
  'Við erum að vinna að jafnréttismálum.',
  '${REVIEWER_ID}');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(2003)}', '${cid(5)}', '${eid(5)}', NULL,
  'Synjun sf.', '5001010005', 'Bergstaðastræti 5', 'Reykjavík', '101', 'MEDIUM', 'K');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(3003)}', '${eid(5)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(5)}');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(3004)}', '${eid(5)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(5)}');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, reason, company_id)
VALUES ('${uid(3005)}', '${eid(5)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'DENIED',
  'IN_REVIEW', 'DENIED',
  'Áætlunin uppfyllir ekki lágmarkskröfur 3. gr. laga um jafna stöðu og jafnan rétt kvenna og karla.',
  '${cid(5)}');

-- Company 6: Samþykkt lítið hf. — equality APPROVED (MEDIUM, no salary required)
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content,
  reviewer_user_id, approved_at, valid_until)
VALUES ('${eid(6)}', 'EQUALITY', 'APPROVED', '5001010006',
  'Fanney Ólafsdóttir', 'fanney@samthykkt.is', 'FEMALE',
  'Fanney Ólafsdóttir', 'fanney@samthykkt.is', '555-0006',
  'ISLAND_IS', 'prov-eq-006', 'JR-2026-006',
  'Jafnréttisáætlun Samþykkt lítið hf. 2026–2029. Við leggjum áherslu á hlutlæg ráðningarferli og gegnsæi í launamálum.',
  '${REVIEWER_ID}',
  NOW() - INTERVAL ''10 days'',
  NOW() - INTERVAL ''10 days'' + INTERVAL ''3 years'');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(2004)}', '${cid(6)}', '${eid(6)}', NULL,
  'Samþykkt lítið hf.', '5001010006', 'Vesturgata 6', 'Reykjavík', '101', 'MEDIUM', 'K');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(3006)}', '${eid(6)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(6)}');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(3007)}', '${eid(6)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(6)}');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(3008)}', '${eid(6)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'APPROVED',
  'IN_REVIEW', 'APPROVED', '${cid(6)}');

-- Company 7: Afturkallað og endursent ehf. — old equality WITHDRAWN, new SUBMITTED
-- Old report (withdrawn)
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content)
VALUES ('${eid(70)}', 'EQUALITY', 'WITHDRAWN', '5001010007',
  'Guðrún Sigríðardóttir', 'gudrun@afturkallad.is', 'FEMALE',
  'Guðrún Sigríðardóttir', 'gudrun@afturkallad.is', '555-0007',
  'ISLAND_IS', 'prov-eq-007a', 'JR-2026-007A',
  'Fyrsta útgáfa áætlunar — síðar dregin til baka.');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(2005)}', '${cid(7)}', '${eid(70)}', NULL,
  'Afturkallað og endursent ehf.', '5001010007', 'Brautarholt 7', 'Reykjavík', '105', 'MEDIUM', 'K');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(3009)}', '${eid(70)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(7)}');

-- New report (replaces the withdrawn one)
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content)
VALUES ('${eid(7)}', 'EQUALITY', 'SUBMITTED', '5001010007',
  'Guðrún Sigríðardóttir', 'gudrun@afturkallad.is', 'FEMALE',
  'Guðrún Sigríðardóttir', 'gudrun@afturkallad.is', '555-0007',
  'ISLAND_IS', 'prov-eq-007b', 'JR-2026-007B',
  'Endurskoðuð jafnréttisáætlun með auknu gagnsæi í launamálum.');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(2006)}', '${cid(7)}', '${eid(7)}', NULL,
  'Afturkallað og endursent ehf.', '5001010007', 'Brautarholt 7', 'Reykjavík', '105', 'MEDIUM', 'K');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, related_report_id, company_id)
VALUES ('${uid(3010)}', '${eid(70)}', 'WITHDRAWN', NULL, 'WITHDRAWN',
  'SUBMITTED', 'WITHDRAWN', '${eid(7)}', '${cid(7)}');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(3011)}', '${eid(7)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(7)}');

COMMIT;
  `
}
```

- [ ] **Step 2: Add `equalityReportsSql()` call to `up()`**

```js
async up(queryInterface) {
  await queryInterface.sequelize.query(companiesSql())
  await queryInterface.sequelize.query(equalityReportsSql())
},
```

- [ ] **Step 3: Verify the file parses**

```bash
node -e "require('./apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js')"
```

- [ ] **Step 4: Commit**

```bash
git add apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js
git commit -m "feat(doe-seed): add equality-only report scenarios (companies 2–7)"
```

---

## Task 3: Approved equality reports for LARGE companies (8–18)

These companies all need an APPROVED equality report as a prerequisite for their salary report scenarios.

**Files:**
- Modify: `apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js`

- [ ] **Step 1: Write `approvedEqualityReportsSql()`**

Companies 8–18 all get an APPROVED equality report. Company 16 also gets an older SUPERSEDED equality report.

```js
function approvedEqualityReportsSql() {
  const companies = [
    { n: 8,  name: 'Laun bíður ehf.',          nationalId: '5001010008', adminName: 'Helga Björnsdóttir',     adminEmail: 'helga@launbidur.is',       providerId: 'prov-eq-008', identifier: 'JR-2026-008' },
    { n: 9,  name: 'Laun drög hf.',             nationalId: '5001010009', adminName: 'Inga Kristmundsdóttir',  adminEmail: 'inga@laundrog.is',         providerId: 'prov-eq-009', identifier: 'JR-2026-009' },
    { n: 10, name: 'Laun sent ehf.',            nationalId: '5001010010', adminName: 'Jóna Eiríksdóttir',     adminEmail: 'jona@launsent.is',         providerId: 'prov-eq-010', identifier: 'JR-2026-010' },
    { n: 11, name: 'Frestun sf.',               nationalId: '5001010011', adminName: 'Katrín Sigurbjörnsdóttir','adminEmail': 'katrin@frestun.is',    providerId: 'prov-eq-011', identifier: 'JR-2026-011' },
    { n: 12, name: 'Yfirfaring hf.',            nationalId: '5001010012', adminName: 'Lára Guðmundsdóttir',   adminEmail: 'lara@yfirfaring.is',       providerId: 'prov-eq-012', identifier: 'JR-2026-012' },
    { n: 13, name: 'Samþykkt hreint ehf.',      nationalId: '5001010013', adminName: 'María Jónasdóttir',     adminEmail: 'maria@samthykkt.is',       providerId: 'prov-eq-013', identifier: 'JR-2026-013' },
    { n: 14, name: 'Samþykkt útlagar hf.',      nationalId: '5001010014', adminName: 'Nína Helgadóttir',      adminEmail: 'nina@utlagar.is',          providerId: 'prov-eq-014', identifier: 'JR-2026-014' },
    { n: 15, name: 'Synjað laun sf.',           nationalId: '5001010015', adminName: 'Ólöf Benediktsdóttir',  adminEmail: 'olof@synjaðlaun.is',       providerId: 'prov-eq-015', identifier: 'JR-2026-015' },
    { n: 16, name: 'Saga jafnréttis ehf.',      nationalId: '5001010016', adminName: 'Petra Sigurðardóttir',  adminEmail: 'petra@sagajafnr.is',       providerId: 'prov-eq-016', identifier: 'JR-2026-016' },
    { n: 17, name: 'Saga launa hf.',            nationalId: '5001010017', adminName: 'Ragna Bjarnardóttir',   adminEmail: 'ragna@sagalauna.is',       providerId: 'prov-eq-017', identifier: 'JR-2026-017' },
    { n: 18, name: 'Undanþága ehf.',            nationalId: '5001010018', adminName: 'Sara Óskarsdóttir',     adminEmail: 'sara@undanthaga.is',       providerId: 'prov-eq-018', identifier: 'JR-2026-018' },
  ]

  let evCounter = 5000
  let snapCounter2 = 3000

  const approvedEqBlock = (c) => {
    const approvedAt = `NOW() - INTERVAL '${c.n * 5} days'`
    const validUntil = `NOW() - INTERVAL '${c.n * 5} days' + INTERVAL '3 years'`
    return `
-- Company ${c.n}: ${c.name} — equality APPROVED
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content,
  reviewer_user_id, approved_at, valid_until)
VALUES ('${eid(c.n)}', 'EQUALITY', 'APPROVED', '${c.nationalId}',
  '${c.adminName}', '${c.adminEmail}', 'FEMALE',
  '${c.adminName}', '${c.adminEmail}', '555-${String(c.n).padStart(4,'0')}',
  'ISLAND_IS', '${c.providerId}', '${c.identifier}',
  'Jafnréttisáætlun ${c.name} 2026–2029. Við leggjum áherslu á jafna meðferð kynjanna og gagnsæi í launamálum.',
  '${REVIEWER_ID}', ${approvedAt}, ${validUntil});

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(snapCounter2++)}', '${cid(c.n)}', '${eid(c.n)}', NULL,
  '${c.name}', '${c.nationalId}', 'Stræti ${c.n}', 'Reykjavík', '101', '${c.n <= 18 && c.n >= 8 && c.n !== 18 ? 'LARGE' : 'MEDIUM'}', 'L');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${eid(c.n)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(c.n)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${eid(c.n)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(c.n)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${eid(c.n)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'APPROVED',
  'IN_REVIEW', 'APPROVED', '${cid(c.n)}');
`
  }

  // Company 16 also gets an OLD superseded equality report
  const oldEqCompany16 = `
-- Company 16: Saga jafnréttis ehf. — OLD equality (SUPERSEDED by current eid(16))
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_content,
  reviewer_user_id, approved_at, valid_until)
VALUES ('${eid(160)}', 'EQUALITY', 'SUPERSEDED', '5001010016',
  'Petra Sigurðardóttir', 'petra@sagajafnr.is', 'FEMALE',
  'Petra Sigurðardóttir', 'petra@sagajafnr.is', '555-0016',
  'ISLAND_IS', 'prov-eq-016-old', 'JR-2023-016',
  'Jafnréttisáætlun Saga jafnréttis ehf. 2023–2026 (útrunnin).',
  '${REVIEWER_ID}',
  NOW() - INTERVAL '3 years 20 days',
  NOW() - INTERVAL '20 days');

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(snapCounter2++)}', '${cid(16)}', '${eid(160)}', NULL,
  'Saga jafnréttis ehf.', '5001010016', 'Stræti 16', 'Reykjavík', '101', 'LARGE', 'L');

INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  related_report_id, company_id)
VALUES ('${uid(evCounter++)}', '${eid(160)}', 'SUPERSEDED', '${REVIEWER_ID}', 'SUPERSEDED',
  '${eid(16)}', '${cid(16)}');
`

  return `BEGIN;\n${companies.map(approvedEqBlock).join('')}${oldEqCompany16}\nCOMMIT;`
}
```

- [ ] **Step 2: Add call in `up()`**

```js
async up(queryInterface) {
  await queryInterface.sequelize.query(companiesSql())
  await queryInterface.sequelize.query(equalityReportsSql())
  await queryInterface.sequelize.query(approvedEqualityReportsSql())
},
```

- [ ] **Step 3: Verify the file parses**

```bash
node -e "require('./apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js')"
```

- [ ] **Step 4: Commit**

```bash
git add apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js
git commit -m "feat(doe-seed): add approved equality reports for LARGE companies (8–18)"
```

---

## Task 4: Global roles + simple salary report scenarios (companies 8–10)

Company 8 = equality APPROVED, no salary report yet (nothing to insert).  
Company 9 = DRAFT salary report.  
Company 10 = SUBMITTED salary report, no outliers.

**Files:**
- Modify: `apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js`

- [ ] **Step 1: Write `globalRolesSql()` and add UUID constants**

`report_employee_role` has no `report_id` — roles are a global lookup table. Create 3 roles once; all salary reports reference them.

```js
// Global role UUIDs (shared across all salary reports)
const ROLE_VERKEFNASTJORI = 'aa000001-0000-0000-0000-000000000001'
const ROLE_SERFRAEDINGUR  = 'aa000002-0000-0000-0000-000000000002'
const ROLE_ADSTODARMADUR  = 'aa000003-0000-0000-0000-000000000003'

function globalRolesSql() {
  return `
BEGIN;
INSERT INTO report_employee_role (id, title) VALUES
  ('${ROLE_VERKEFNASTJORI}', 'Verkefnastjóri'),
  ('${ROLE_SERFRAEDINGUR}',  'Sérfræðingur'),
  ('${ROLE_ADSTODARMADUR}',  'Aðstoðarmaður');
COMMIT;
  `
}
```

Add call in `up()`:
```js
await queryInterface.sequelize.query(globalRolesSql())
```

Add delete to `downSql()` (before the company delete block):
```js
DELETE FROM report_employee_role WHERE id IN (
  '${ROLE_VERKEFNASTJORI}', '${ROLE_SERFRAEDINGUR}', '${ROLE_ADSTODARMADUR}'
);
```

- [ ] **Step 2: Write `salaryScaffoldSql(reportId, nationalId, companyName, companyN, status, eqReportId, options)`**

This helper generates the criterion/sub-criterion/step/role-step-link/employee/result block for one salary report. It does NOT insert into `report_employee_role` (global roles already exist). `options`: `{ hasOutliers, outliersExplained }`.

Salary math:
- Scores: role 1 employees score=2.00, role 2 score=1.00, role 3 score=0.00
- Regression: `predicted = 500000 + score * 100000`
- Employee 1 (MALE, role 1): actual=850000 vs predicted=700000 → +21.4% → outlier when `hasOutliers=true`
- All others: actual within ±1% of predicted

```js
function salaryScaffoldSql(reportId, nationalId, companyName, companyN, status, eqReportId, options = {}) {
  const { hasOutliers = false, outliersExplained = false } = options
  const base = companyN * 100

  // Per-report UUIDs (criteria, sub-criteria, steps, role-step links, employees, result)
  const critIds  = [uid(base + 10), uid(base + 11)]
  const scrtIds  = [uid(base + 20), uid(base + 21)]
  const stepIds  = [uid(base + 30), uid(base + 31), uid(base + 32), uid(base + 33)]
  const empIds   = Array.from({length: 6}, (_, i) => uid(base + 40 + i))
  const resultId = uid(base + 50)
  const roleResultIds = [uid(base + 51), uid(base + 52), uid(base + 53)]

  // Conditional columns for reviewer/approval fields
  const needsReviewer = ['APPROVED','SUPERSEDED','DENIED','IN_REVIEW'].includes(status)
  const needsApproval = ['APPROVED','SUPERSEDED'].includes(status)
  const extraCols = needsApproval
    ? ', reviewer_user_id, approved_at, valid_until'
    : needsReviewer ? ', reviewer_user_id' : ''
  const extraVals = needsApproval
    ? `, '${REVIEWER_ID}', NOW() - INTERVAL '${companyN} days', NOW() - INTERVAL '${companyN} days' + INTERVAL '3 years'`
    : needsReviewer ? `, '${REVIEWER_ID}'` : ''

  const outlierSnapshot = hasOutliers
    ? JSON.stringify({ outliers: [{ ordinal: 1, adjustedBaseSalary: 850000, predictedBaseSalary: 700000, direction: 'ABOVE', differencePercent: 21.43, scoreBucket: '2.0' }] })
    : JSON.stringify({ outliers: [] })
  const baseSnap = JSON.stringify({ genderPayGap: hasOutliers ? 9.1 : 0.8 })
  const fullSnap = JSON.stringify({ genderPayGap: hasOutliers ? 9.1 : 0.8, roles: 3, employees: 6 })

  let sql = `
-- Salary report: company ${companyN} ${companyName} status=${status}
INSERT INTO report (id, type, status, company_national_id, company_admin_name, company_admin_email,
  company_admin_gender, contact_name, contact_email, contact_phone,
  provider_type, provider_id, identifier, equality_report_id,
  average_employee_male_count, average_employee_female_count, average_employee_neutral_count${extraCols})
VALUES ('${reportId}', 'SALARY', '${status}', '${nationalId}',
  'Jón Gunnarsson', 'jon@company${companyN}.is', 'MALE',
  'Jón Gunnarsson', 'jon@company${companyN}.is', '555-${String(companyN).padStart(4,'0')}',
  'ISLAND_IS', 'prov-sal-${String(companyN).padStart(3,'0')}', 'LS-2026-${String(companyN).padStart(3,'0')}',
  '${eqReportId}', 3, 3, 0${extraVals});

INSERT INTO company_report (id, company_id, report_id, parent_company_id,
  name, national_id, address, city, postcode, employee_count_category, isat_category)
VALUES ('${uid(base + 60)}', '${cid(companyN)}', '${reportId}', NULL,
  '${companyName}', '${nationalId}', 'Stræti ${companyN}', 'Reykjavík', '101', '${companyN === 18 ? 'MEDIUM' : 'LARGE'}', 'L');

INSERT INTO report_criterion (id, report_id, title, weight, description, type) VALUES
  ('${critIds[0]}', '${reportId}', 'Ábyrgð', 0.5000, 'Ábyrgð og umfang starfsins', 'RESPONSIBILITY'),
  ('${critIds[1]}', '${reportId}', 'Hæfni',  0.5000, 'Menntun og reynsla',          'COMPETENCE');

INSERT INTO report_sub_criterion (id, report_criterion_id, title, description, weight) VALUES
  ('${scrtIds[0]}', '${critIds[0]}', 'Stjórnunarleg ábyrgð', 'Fjöldi undirlægra starfsmanna', 1.0000),
  ('${scrtIds[1]}', '${critIds[1]}', 'Formlegt nám',          'Menntunarstig',                1.0000);

INSERT INTO report_sub_criterion_step (id, report_sub_criterion_id, "order", description, score) VALUES
  ('${stepIds[0]}', '${scrtIds[0]}', 1, 'Engin stjórnunarleg ábyrgð',   0.00),
  ('${stepIds[1]}', '${scrtIds[0]}', 2, 'Stjórnun 1–5 starfsmanna',     1.00),
  ('${stepIds[2]}', '${scrtIds[1]}', 1, 'Framhaldsskólapróf eða lægra', 0.00),
  ('${stepIds[3]}', '${scrtIds[1]}', 2, 'Háskólapróf',                  1.00);

-- Link global roles to this report''s criterion steps
INSERT INTO report_employee_role_criterion_step (id, report_employee_role_id, report_sub_criterion_step_id) VALUES
  ('${uid(base + 70)}', '${ROLE_VERKEFNASTJORI}', '${stepIds[1]}'),
  ('${uid(base + 71)}', '${ROLE_VERKEFNASTJORI}', '${stepIds[3]}'),
  ('${uid(base + 72)}', '${ROLE_SERFRAEDINGUR}',  '${stepIds[1]}'),
  ('${uid(base + 73)}', '${ROLE_SERFRAEDINGUR}',  '${stepIds[2]}'),
  ('${uid(base + 74)}', '${ROLE_ADSTODARMADUR}',  '${stepIds[0]}'),
  ('${uid(base + 75)}', '${ROLE_ADSTODARMADUR}',  '${stepIds[2]}');

INSERT INTO report_employee (id, report_id, ordinal, education, field, department,
  start_date, work_ratio, base_salary, additional_salary, bonus_salary,
  gender, report_employee_role_id, score) VALUES
  ('${empIds[0]}','${reportId}',1,'MASTER',        'Viðskiptafræði','Stjórnun', '2015-01-15',1.0000, ${hasOutliers ? 850000 : 707000}.00,50000.00,100000.00,'MALE',  '${ROLE_VERKEFNASTJORI}',2.00),
  ('${empIds[1]}','${reportId}',2,'MASTER',        'Viðskiptafræði','Stjórnun', '2017-03-01',1.0000,703000.00,50000.00, 80000.00,'FEMALE','${ROLE_VERKEFNASTJORI}',2.00),
  ('${empIds[2]}','${reportId}',3,'BACHELOR',      'Tölvunarfræði', 'Þróun',    '2018-06-01',1.0000,602000.00,30000.00, 50000.00,'MALE',  '${ROLE_SERFRAEDINGUR}', 1.00),
  ('${empIds[3]}','${reportId}',4,'BACHELOR',      'Tölvunarfræði', 'Þróun',    '2019-09-01',1.0000,598000.00,30000.00, 40000.00,'FEMALE','${ROLE_SERFRAEDINGUR}', 1.00),
  ('${empIds[4]}','${reportId}',5,'UPPER_SECONDARY','Almenn námsbraut','Þjónusta','2020-01-01',1.0000,502000.00,10000.00,    NULL,'MALE',  '${ROLE_ADSTODARMADUR}', 0.00),
  ('${empIds[5]}','${reportId}',6,'UPPER_SECONDARY','Almenn námsbraut','Þjónusta','2021-06-01',1.0000,498000.00,10000.00,    NULL,'FEMALE','${ROLE_ADSTODARMADUR}', 0.00);

INSERT INTO report_result (id, report_id, salary_difference_threshold_percent,
  calculation_version, base_snapshot, full_snapshot, outlier_analysis_snapshot)
VALUES ('${resultId}', '${reportId}', 3.90, 'v1',
  '${baseSnap.replace(/'/g, "''")}',
  '${fullSnap.replace(/'/g, "''")}',
  '${outlierSnapshot.replace(/'/g, "''")}');

INSERT INTO report_role_result (id, report_result_id, report_employee_role_id, role_title, base_snapshot, full_snapshot) VALUES
  ('${roleResultIds[0]}','${resultId}','${ROLE_VERKEFNASTJORI}','Verkefnastjóri','{"genderPayGap":${hasOutliers ? 9.1 : 0.6}}','{"employees":2}'),
  ('${roleResultIds[1]}','${resultId}','${ROLE_SERFRAEDINGUR}', 'Sérfræðingur', '{"genderPayGap":0.7}',                        '{"employees":2}'),
  ('${roleResultIds[2]}','${resultId}','${ROLE_ADSTODARMADUR}', 'Aðstoðarmaður','{"genderPayGap":0.4}',                        '{"employees":2}');
`

  if (hasOutliers) {
    const exp = outliersExplained
      ? `'Starfsmaður hefur sérfræðiþekkingu sem réttlætir hærra laun.',
         'Endurskoðun launa í næstu launaviðræðum.',
         'Jón Gunnarsson',
         'Framkvæmdastjóri'`
      : `NULL, NULL, NULL, NULL`
    sql += `
INSERT INTO report_employee_outlier (id, report_employee_id, reason, action, signature_name, signature_role)
VALUES ('${uid(base + 80)}', '${empIds[0]}', ${exp});
`
  }

  return sql
}
```

- [ ] **Step 3: Write `simpleSalaryScenariosSql()` for companies 9 and 10**

```js
function simpleSalaryScenariosSql() {
  let evCounter = 8000
  let sql = 'BEGIN;\n'

  // Company 9: salary DRAFT (no events for DRAFT)
  sql += salaryScaffoldSql(sid(9), '5001010009', 'Laun drög hf.', 9, 'DRAFT', eid(9))

  // Company 10: salary SUBMITTED, no outliers
  sql += salaryScaffoldSql(sid(10), '5001010010', 'Laun sent ehf.', 10, 'SUBMITTED', eid(10))
  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(10)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(10)}');
`
  sql += '\nCOMMIT;'
  return sql
}
```

Add calls in `up()`:
```js
await queryInterface.sequelize.query(globalRolesSql())
// ... existing calls ...
await queryInterface.sequelize.query(simpleSalaryScenariosSql())
```

- [ ] **Step 3: Add call in `up()`**

```js
async up(queryInterface) {
  await queryInterface.sequelize.query(companiesSql())
  await queryInterface.sequelize.query(equalityReportsSql())
  await queryInterface.sequelize.query(approvedEqualityReportsSql())
  await queryInterface.sequelize.query(simpleSalaryScenariosSql())
},
```

- [ ] **Step 4: Verify the file parses**

```bash
node -e "require('./apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js')"
```

- [ ] **Step 5: Commit**

```bash
git add apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js
git commit -m "feat(doe-seed): add salary report DRAFT and SUBMITTED scenarios (companies 9–10)"
```

---

## Task 5: POSTPONED salary report (company 11)

- [ ] **Step 1: Write `postponedSalarySql()`**

```js
function postponedSalarySql() {
  let evCounter = 9000

  let sql = 'BEGIN;\n'

  // Company 11: salary POSTPONED — all outliers deferred (NULL explanation fields)
  sql += salaryScaffoldSql(sid(11), '5001010011', 'Frestun sf.', 11, 'POSTPONED', eid(11), {
    hasOutliers: true,
    outliersExplained: false,  // NULL fields — postponed
  })

  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(11)}', 'SUBMITTED', NULL, 'POSTPONED', '${cid(11)}');
-- Note: report_status on the SUBMITTED event = POSTPONED, because the submission
-- itself landed the report in POSTPONED status (all outliers were deferred).
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(11)}', 'STATUS_CHANGED', NULL, 'POSTPONED',
  'SUBMITTED', 'POSTPONED', '${cid(11)}');
`

  sql += '\nCOMMIT;'
  return sql
}
```

- [ ] **Step 2: Add call in `up()`**

```js
await queryInterface.sequelize.query(postponedSalarySql())
```

- [ ] **Step 3: Verify + Commit**

```bash
node -e "require('./apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js')"
git add apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js
git commit -m "feat(doe-seed): add POSTPONED salary report scenario (company 11)"
```

---

## Task 6: IN_REVIEW salary report with outliers (company 12)

- [ ] **Step 1: Write `inReviewSalarySql()`**

```js
function inReviewSalarySql() {
  let evCounter = 10000

  let sql = 'BEGIN;\n'

  // Company 12: salary IN_REVIEW, outlier present but NOT yet explained
  sql += salaryScaffoldSql(sid(12), '5001010012', 'Yfirfaring hf.', 12, 'IN_REVIEW', eid(12), {
    hasOutliers: true,
    outliersExplained: false,
  })

  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(12)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(12)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(12)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(12)}');

INSERT INTO report_comment (id, report_id, author_kind, author_user_id, visibility, body, report_status)
VALUES ('${uid(10200)}', '${sid(12)}', 'REVIEWER', '${REVIEWER_ID}', 'EXTERNAL',
  'Útlagi nr. 1 þarfnast skýringar. Vinsamlegast útskýrið hvers vegna laun þessa starfsmanns eru 13% yfir spá.', 'IN_REVIEW');
`

  sql += '\nCOMMIT;'
  return sql
}
```

- [ ] **Step 2: Add call + verify + commit**

```js
await queryInterface.sequelize.query(inReviewSalarySql())
```

```bash
node -e "require('./apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js')"
git add apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js
git commit -m "feat(doe-seed): add IN_REVIEW salary report with outlier (company 12)"
```

---

## Task 7: APPROVED salary reports (companies 13 and 14)

- [ ] **Step 1: Write `approvedSalarySql()`**

```js
function approvedSalarySql() {
  let evCounter = 11000

  let sql = 'BEGIN;\n'

  // Company 13: salary APPROVED, no outliers
  sql += salaryScaffoldSql(sid(13), '5001010013', 'Samþykkt hreint ehf.', 13, 'APPROVED', eid(13), { hasOutliers: false })
  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(13)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(13)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(13)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(13)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(13)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'APPROVED',
  'IN_REVIEW', 'APPROVED', '${cid(13)}');
`

  // Company 14: salary APPROVED, outliers explained
  sql += salaryScaffoldSql(sid(14), '5001010014', 'Samþykkt útlagar hf.', 14, 'APPROVED', eid(14), {
    hasOutliers: true,
    outliersExplained: true,
  })
  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(14)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(14)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(14)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(14)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(14)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'APPROVED',
  'IN_REVIEW', 'APPROVED', '${cid(14)}');
`

  sql += '\nCOMMIT;'
  return sql
}
```

- [ ] **Step 2: Add call + verify + commit**

```js
await queryInterface.sequelize.query(approvedSalarySql())
```

```bash
node -e "require('./apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js')"
git add apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js
git commit -m "feat(doe-seed): add APPROVED salary report scenarios (companies 13–14)"
```

---

## Task 8: DENIED salary, SUPERSEDED equality+salary, and override scenarios (companies 15–18)

- [ ] **Step 1: Write `remainingSalarySql()`**

```js
function remainingSalarySql() {
  let evCounter = 12000

  let sql = 'BEGIN;\n'

  // Company 15: salary DENIED
  sql += salaryScaffoldSql(sid(15), '5001010015', 'Synjað laun sf.', 15, 'DENIED', eid(15), { hasOutliers: false })
  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(15)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(15)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(15)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(15)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, reason, company_id)
VALUES ('${uid(evCounter++)}', '${sid(15)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'DENIED',
  'IN_REVIEW', 'DENIED',
  'Launagögn uppfylla ekki kröfur 12. gr. reglugerðar nr. 1000/2017 um jafna meðferð kynjanna.',
  '${cid(15)}');
`

  // Company 16: old equality SUPERSEDED (already inserted in Task 3), current APPROVED.
  // New salary report (APPROVED) referencing the current (non-superseded) equality report.
  sql += salaryScaffoldSql(sid(16), '5001010016', 'Saga jafnréttis ehf.', 16, 'APPROVED', eid(16), { hasOutliers: false })
  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(16)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(16)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(16)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(16)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(16)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'APPROVED',
  'IN_REVIEW', 'APPROVED', '${cid(16)}');
`

  // Company 17: old salary SUPERSEDED + new salary APPROVED
  // Old salary (superseded)
  sql += salaryScaffoldSql(sid(170), '5001010017', 'Saga launa hf.', 170, 'SUPERSEDED', eid(17), { hasOutliers: false })
  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  related_report_id, company_id)
VALUES ('${uid(evCounter++)}', '${sid(170)}', 'SUPERSEDED', '${REVIEWER_ID}', 'SUPERSEDED',
  '${sid(17)}', '${cid(17)}');
`
  // New salary (approved)
  sql += salaryScaffoldSql(sid(17), '5001010017', 'Saga launa hf.', 17, 'APPROVED', eid(17), { hasOutliers: false })
  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(17)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(17)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(17)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'IN_REVIEW',
  'SUBMITTED', 'IN_REVIEW', '${cid(17)}');
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status,
  from_status, to_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(17)}', 'STATUS_CHANGED', '${REVIEWER_ID}', 'APPROVED',
  'IN_REVIEW', 'APPROVED', '${cid(17)}');
`

  // Company 18: MEDIUM with salary_report_required_override=TRUE — salary SUBMITTED
  sql += salaryScaffoldSql(sid(18), '5001010018', 'Undanþága ehf.', 18, 'SUBMITTED', eid(18), { hasOutliers: false })
  sql += `
INSERT INTO report_event (id, report_id, event_type, actor_user_id, report_status, company_id)
VALUES ('${uid(evCounter++)}', '${sid(18)}', 'SUBMITTED', NULL, 'SUBMITTED', '${cid(18)}');
`

  sql += '\nCOMMIT;'
  return sql
}
```

- [ ] **Step 2: Add call + verify + commit**

```js
await queryInterface.sequelize.query(remainingSalarySql())
```

```bash
node -e "require('./apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js')"
git add apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js
git commit -m "feat(doe-seed): add DENIED, SUPERSEDED, and override salary scenarios (companies 15–18)"
```

---

## Task 9: Run the full seed against a local DB and verify

- [ ] **Step 1: Run migrations + seed**

From `apps/directorate-of-equality-api/`:
```bash
npx sequelize db:migrate
npx sequelize db:seed:all
```

Expected: no errors, each seeder reports success.

- [ ] **Step 2: Spot-check key scenarios via psql**

```sql
-- All 28 companies present
SELECT COUNT(*) FROM company;  -- expected: 28

-- Status distribution for equality reports
SELECT status, COUNT(*) FROM report WHERE type = 'EQUALITY' GROUP BY status ORDER BY status;

-- Status distribution for salary reports
SELECT status, COUNT(*) FROM report WHERE type = 'SALARY' GROUP BY status ORDER BY status;

-- Outliers: NULL (postponed) vs explained
SELECT
  CASE WHEN reason IS NULL THEN 'deferred' ELSE 'explained' END AS outlier_state,
  COUNT(*)
FROM report_employee_outlier
GROUP BY outlier_state;

-- Company 11: salary POSTPONED, outlier with NULL fields
SELECT r.status, reo.reason
FROM report r
JOIN report_employee re ON re.report_id = r.id
JOIN report_employee_outlier reo ON reo.report_employee_id = re.id
WHERE r.company_national_id = '5001010011';
-- expected: status=POSTPONED, reason=NULL

-- Company 14: salary APPROVED, outlier explained
SELECT r.status, reo.reason
FROM report r
JOIN report_employee re ON re.report_id = r.id
JOIN report_employee_outlier reo ON reo.report_employee_id = re.id
WHERE r.company_national_id = '5001010014';
-- expected: status=APPROVED, reason IS NOT NULL

-- Company 7: WITHDRAWN + new SUBMITTED
SELECT status, identifier FROM report WHERE company_national_id = '5001010007' ORDER BY created_at;
-- expected: WITHDRAWN JR-2026-007A, SUBMITTED JR-2026-007B
```

- [ ] **Step 3: Seed down to verify cleanup**

```bash
npx sequelize db:seed:undo
```

```sql
SELECT COUNT(*) FROM company WHERE national_id LIKE '500101%';  -- expected: 0
SELECT COUNT(*) FROM report  WHERE company_national_id LIKE '500101%';  -- expected: 0
```

- [ ] **Step 4: Commit**

```bash
git add apps/directorate-of-equality-api/db/seeders/20260526-doe-scenario-seed.js
git commit -m "feat(doe-seed): complete scenario seed with 28 companies and all status paths"
```
