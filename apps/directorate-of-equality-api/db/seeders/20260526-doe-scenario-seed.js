'use strict'

// Existing reviewer (from initial seed)
const REVIEWER_ID = 'b4e98cee-a4d8-4924-90df-b820c4bc0801'

// Helper: pad a number into a UUID-shaped constant
const cid = (n) => `c${String(n).padStart(7,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}`
const eid = (n) => `e${String(n).padStart(7,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}` // equality report
const sid = (n) => `b${String(n).padStart(7,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}` // salary report (b = besold)
const uid = (n) => `f${String(n).padStart(7,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}` // generic (f = fill-in)

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(companiesSql())
    await queryInterface.sequelize.query(equalityReportsSql())
  },
  async down(queryInterface) {
    return await queryInterface.sequelize.query(downSql())
  },
}

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

function equalityReportsSql() {
  return `
BEGIN;

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
  WHERE report_sub_criterion_step_id IN (
    SELECT rscs.id FROM report_sub_criterion_step rscs
    JOIN report_sub_criterion rsc ON rsc.id = rscs.report_sub_criterion_id
    JOIN report_criterion rc ON rc.id = rsc.report_criterion_id
    JOIN report r ON r.id = rc.report_id
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
DELETE FROM company_report      WHERE company_id IN (${companyIds});
DELETE FROM report              WHERE company_national_id LIKE '500101%';
DELETE FROM company             WHERE id IN (${companyIds});

COMMIT;
  `
}
