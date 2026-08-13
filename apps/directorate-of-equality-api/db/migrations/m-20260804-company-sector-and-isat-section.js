'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Two premade admin filter axes for the company list.
    --
    -- 1. isat_section + isat_category.section/division
    --
    --    Until now a company could only be filtered by its exact ÍSAT2008 leaf
    --    code, so "all public administration" meant enumerating every leaf under
    --    division 84 in the query string. ÍSAT rolls leaves up into 22 sections
    --    (bálkar, A–U plus X) via the 2-digit division, exactly as postcodes roll
    --    up into regions — so this mirrors the postcode → region shape: a
    --    reference table with a stable letter key, reached by joining, never
    --    duplicated onto the company.
    --
    --    db/README.md previously stated the section letter is "not numerically
    --    derivable and is intentionally dropped". That is true of arithmetic but
    --    not of lookup: section is a *total* function of the division over a
    --    fixed 22-row table, and all 88 divisions present in the seed are
    --    standard NACE Rev. 2 divisions. Hence isat_section_for_code() below —
    --    one source of truth for the mapping, used by this backfill and by
    --    db/seeders/seed-isat-category.js so the two can never drift.
    --
    --    The one exception to "section is a function of the division" is X
    --    (Óþekkt starfsemi), which ÍSAT2008 adds on the fifth digit and NACE has
    --    no equivalent for: division 99 holds BOTH 99.00.0 (extraterritorial
    --    organisations → U) and 99.99.9 (unknown activity → X). Matching the
    --    whole code for 99999 is therefore load-bearing — mapping it to U by its
    --    division would file every company with no known activity under
    --    "organisations with extraterritorial status", which is exactly the kind
    --    of silent misfiling the sector enum's UNKNOWN value avoids.
    --
    -- 2. company.sector (+ legal_form_id/name)
    --
    --    ÍSAT classifies what an entity *does*, not who owns it: a state-owned
    --    hospital and a private clinic share 86xxx, so section O alone cannot
    --    answer "private vs government/state". RSK's legalForm is the axis that
    --    can. We store the raw RSK legal form id AND name alongside the derived
    --    sector on purpose — the id → sector mapping is currently inferred, not
    --    confirmed against live payloads, so keeping the raw value means a
    --    corrected mapping can be re-derived locally with one UPDATE instead of
    --    re-sweeping RSK one company at a time (the registry has no bulk
    --    endpoint — only GET /{nationalId}).
    --
    --    UNKNOWN is a first-class value, never collapsed into PRIVATE: an admin
    --    filtering "private companies" must not silently be shown companies we
    --    simply failed to classify.
    --
    --    sector_override mirrors salary_report_required_override — when an admin
    --    corrects a sector by hand, the backfill must leave that row alone
    --    rather than reset it to UNKNOWN because RSK's form id is unmapped.
    -- ============================================================

    CREATE TABLE isat_section (
      code TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      description_en TEXT NOT NULL
    );

    -- The 22 ÍSAT2008 sections: the 21 NACE Rev. 2 sections A–U, plus X
    -- (Óþekkt starfsemi), which is an ÍSAT2008 addition with no NACE equivalent.
    --
    -- The Icelandic wording is verbatim from Hagstofan's ÍSAT2008 handbook
    -- (hagstofa.is/media/49171/isat2008.pdf) — both its contents listing and each
    -- bálkur's own heading, which agree. Do not "tidy" these strings: they are
    -- the official titles, so e.g. E is "meðhöndlun úrgangs" (waste management)
    -- and not "sorphirða" (refuse collection), and O separates its clauses with a
    -- semicolon. The English titles are the official NACE Rev. 2 section titles;
    -- X, having none, uses the same wording as leaf 99.99.9 in the seed data.
    INSERT INTO isat_section (code, description, description_en) VALUES
      ('A', 'Landbúnaður, skógrækt og fiskveiðar', 'Agriculture, forestry and fishing'),
      ('B', 'Námugröftur og vinnsla hráefna úr jörðu', 'Mining and quarrying'),
      ('C', 'Framleiðsla', 'Manufacturing'),
      ('D', 'Rafmagns-, gas- og hitaveitur', 'Electricity, gas, steam and air conditioning supply'),
      ('E', 'Vatnsveita, fráveita, meðhöndlun úrgangs og afmengun', 'Water supply; sewerage, waste management and remediation activities'),
      ('F', 'Byggingarstarfsemi og mannvirkjagerð', 'Construction'),
      ('G', 'Heild- og smásöluverslun, viðgerðir á vélknúnum ökutækjum', 'Wholesale and retail trade; repair of motor vehicles and motorcycles'),
      ('H', 'Flutningur og geymsla', 'Transportation and storage'),
      ('I', 'Rekstur gististaða og veitingarekstur', 'Accommodation and food service activities'),
      ('J', 'Upplýsingar og fjarskipti', 'Information and communication'),
      ('K', 'Fjármála- og vátryggingastarfsemi', 'Financial and insurance activities'),
      ('L', 'Fasteignaviðskipti', 'Real estate activities'),
      ('M', 'Sérfræðileg, vísindaleg og tæknileg starfsemi', 'Professional, scientific and technical activities'),
      ('N', 'Leigustarfsemi og ýmis sérhæfð þjónusta', 'Administrative and support service activities'),
      ('O', 'Opinber stjórnsýsla og varnarmál; almannatryggingar', 'Public administration and defence; compulsory social security'),
      ('P', 'Fræðslustarfsemi', 'Education'),
      ('Q', 'Heilbrigðis- og félagsþjónusta', 'Human health and social work activities'),
      ('R', 'Menningar-, íþrótta- og tómstundastarfsemi', 'Arts, entertainment and recreation'),
      ('S', 'Félagasamtök og önnur þjónustustarfsemi', 'Other service activities'),
      ('T', 'Atvinnurekstur innan heimilis, þjónustustarfsemi og vöruframleiðsla til eigin nota', 'Activities of households as employers'),
      ('U', 'Starfsemi stofnana og samtaka með úrlendisrétt', 'Activities of extraterritorial organisations and bodies'),
      ('X', 'Óþekkt starfsemi', 'Unknown activity');

    -- Section letter for a normalized 5-digit ÍSAT leaf code, via its 2-digit
    -- division. Returns NULL for a division outside NACE Rev. 2 — which then
    -- trips the NOT NULL below rather than silently misfiling the row.
    -- IMMUTABLE so it can be used in index/generated-column expressions later.
    --
    -- 99999 is matched on the whole code, before the division rules: division 99
    -- is shared by 99.00.0 (extraterritorial organisations → U) and 99.99.9
    -- (Óþekkt starfsemi → X), so it is the one division that does not determine
    -- its section. Without this case every company of unknown activity would be
    -- filed under U and show up in the section filter as an embassy.
    -- OR REPLACE because down() intentionally leaves this function in place
    -- (the seeder depends on it), so a re-run of up() must not collide.
    CREATE OR REPLACE FUNCTION isat_section_for_code(code TEXT) RETURNS TEXT AS $$
      SELECT CASE
        WHEN $1 = '99999'            THEN 'X'
        WHEN d BETWEEN '01' AND '03' THEN 'A'
        WHEN d BETWEEN '05' AND '09' THEN 'B'
        WHEN d BETWEEN '10' AND '33' THEN 'C'
        WHEN d = '35'                THEN 'D'
        WHEN d BETWEEN '36' AND '39' THEN 'E'
        WHEN d BETWEEN '41' AND '43' THEN 'F'
        WHEN d BETWEEN '45' AND '47' THEN 'G'
        WHEN d BETWEEN '49' AND '53' THEN 'H'
        WHEN d BETWEEN '55' AND '56' THEN 'I'
        WHEN d BETWEEN '58' AND '63' THEN 'J'
        WHEN d BETWEEN '64' AND '66' THEN 'K'
        WHEN d = '68'                THEN 'L'
        WHEN d BETWEEN '69' AND '75' THEN 'M'
        WHEN d BETWEEN '77' AND '82' THEN 'N'
        WHEN d = '84'                THEN 'O'
        WHEN d = '85'                THEN 'P'
        WHEN d BETWEEN '86' AND '88' THEN 'Q'
        WHEN d BETWEEN '90' AND '93' THEN 'R'
        WHEN d BETWEEN '94' AND '96' THEN 'S'
        WHEN d BETWEEN '97' AND '98' THEN 'T'
        WHEN d = '99'                THEN 'U'
        ELSE NULL
      END
      FROM (SELECT substring($1 FROM 1 FOR 2) AS d) AS parts;
    $$ LANGUAGE sql IMMUTABLE;

    -- Added nullable, backfilled, then constrained — on a fresh database
    -- isat_category is still empty here (seeders run after migrations) and the
    -- seeder supplies both columns itself.
    ALTER TABLE isat_category
      ADD COLUMN section TEXT DEFAULT NULL
        REFERENCES isat_section(code) ON DELETE RESTRICT,
      ADD COLUMN division TEXT DEFAULT NULL;

    UPDATE isat_category
      SET division = substring(code FROM 1 FOR 2),
          section = isat_section_for_code(code);

    ALTER TABLE isat_category
      ALTER COLUMN section SET NOT NULL,
      ALTER COLUMN division SET NOT NULL;

    CREATE INDEX isat_category_section_idx ON isat_category (section);
    CREATE INDEX isat_category_division_idx ON isat_category (division);

    -- The section filter reaches isat_category by inner-joining
    -- company.isat_category_code → isat_category.code. That FK column was added
    -- in m-20260619 but never indexed, because nothing traversed it from the
    -- company side until now.
    CREATE INDEX company_isat_category_code_idx ON company (isat_category_code);

    CREATE TYPE company_sector_enum AS ENUM ('UNKNOWN', 'PRIVATE', 'PUBLIC');

    ALTER TABLE company
      ADD COLUMN sector company_sector_enum NOT NULL DEFAULT 'UNKNOWN',
      ADD COLUMN sector_override BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN legal_form_id TEXT DEFAULT NULL,
      ADD COLUMN legal_form_name TEXT DEFAULT NULL;

    CREATE INDEX company_sector_idx ON company (sector);

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP INDEX company_isat_category_code_idx;
    DROP INDEX company_sector_idx;

    ALTER TABLE company
      DROP COLUMN legal_form_name,
      DROP COLUMN legal_form_id,
      DROP COLUMN sector_override,
      DROP COLUMN sector;

    DROP TYPE company_sector_enum;

    DROP INDEX isat_category_division_idx;
    DROP INDEX isat_category_section_idx;

    ALTER TABLE isat_category
      DROP COLUMN division,
      DROP COLUMN section;

    -- isat_section_for_code() is deliberately NOT dropped. db/seeders/
    -- seed-isat-category.js calls it inside its VALUES list, so a
    -- db:migrate:undo followed by db:seed:all would fail with "function
    -- isat_section_for_code(text) does not exist" — and because the call is
    -- evaluated before ON CONFLICT DO NOTHING can skip anything, even an
    -- already-seeded database would error. Leaving the function behind keeps
    -- local rollback reversible; up() would fail on re-run otherwise, hence
    -- CREATE OR REPLACE above.
    DROP TABLE isat_section;

    COMMIT;
    `)
  },
}
