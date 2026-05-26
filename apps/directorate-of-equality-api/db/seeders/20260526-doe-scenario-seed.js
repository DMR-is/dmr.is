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
