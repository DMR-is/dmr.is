'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = queryInterface.sequelize
    // ============================================================
    // company.sector: split PUBLIC into three, at the client's request.
    //
    // The original two-bucket "private vs government/state" filter
    // (PRIVATE | PUBLIC) is replaced with the four categories the client
    // actually wants: Fyrirtæki, Ráðuneyti, Ríkisaðilar, Sveitarfélög.
    // UNKNOWN is kept as-is — see company.enums.ts for why it must never be
    // folded into a classified bucket.
    //
    // Data mapping on the existing rows:
    //   PRIVATE → FYRIRTAEKI    (an exact rename, not a guess)
    //   PUBLIC  → SVEITARFELAG  when the row's stored RSK legal form says so
    //           → RIKISADILI    otherwise (best-effort default — caveat below)
    //   UNKNOWN → UNKNOWN
    //
    // PUBLIC covered both Ríkisaðilar and Sveitarfélög, so it has to be split
    // back apart. For one class of rows the answer is still in the table:
    // companies created through the RSK lookup path
    // (CompanyService.getOrCreateByNationalId → resolveSector) persist
    // legal_form_id/legal_form_name alongside the derived sector, so
    // 'Sveitarfélag'/'Byggðasamlag' can be recovered exactly. The CASE below
    // does that rather than defaulting those rows to RIKISADILI.
    //
    // The match is on a lower-cased prefix because the stored values are RSK's
    // raw, accented strings ('Sveitarfélag', 'Byggðasamlag'); the prefixes stop
    // before the first accented character so no unaccenting is needed.
    //
    // ⚠️ Rows that carry NO legal form cannot be recovered this way — the sheet
    // load (scripts/company-register-to-sql.ts) writes sector but never
    // legal_form_* (see COMPANY_COLUMNS), and an earlier version of its
    // readSector collapsed both Tegund spellings into one PUBLIC bucket. Those
    // fall to RIKISADILI here, and two different fixes apply:
    //   - Rows the sheet import classified (sector_override = false): a
    //     re-run of the now-fixed load script corrects them automatically —
    //     its ON CONFLICT clause lets the sheet overwrite any non-overridden
    //     sector (see COMPANY_ON_CONFLICT).
    //   - Rows an admin classified by hand (sector_override = true): the
    //     reload never touches these, so any that are actually a
    //     municipality — not a state agency — need a manual
    //     PATCH /company/:id/sector after this migration.
    // RADUNEYTI (ministry) is never produced by this migration: no
    // rekstrarform or ÍSAT code identifies a ministry, so every ministry
    // among the existing rows needs the same manual reclassification
    // regardless of override state.
    //
    // Follows the shape m-20260624 was rewritten into after an incident: ONE
    // `sql.transaction()` that Sequelize actually knows about (a literal
    // `BEGIN;` in a query string leaves it unaware, so nothing issues a real
    // ROLLBACK), plus pg_catalog guards so the migration is idempotent and
    // converges from a half-applied state instead of wedging on the rename.
    // ============================================================
    await sql.transaction(async (transaction) => {
      const run = (text) => sql.query(text, { transaction })

      await run(`
        DO $$
        BEGIN
          -- (a) If the live enum still has PRIVATE, rename it aside and build
          --     the four-way replacement. A stray _old here means an earlier
          --     run left an inconsistent state we shouldn't silently
          --     steamroll.
          IF EXISTS (
            SELECT 1 FROM pg_enum e
              JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'company_sector_enum' AND e.enumlabel = 'PRIVATE'
          ) THEN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_sector_enum_old') THEN
              RAISE EXCEPTION 'company_sector_enum_old already exists alongside a live PRIVATE enum; resolve partial migration state manually';
            END IF;
            ALTER TYPE company_sector_enum RENAME TO company_sector_enum_old;
            CREATE TYPE company_sector_enum AS ENUM (
              'UNKNOWN', 'FYRIRTAEKI', 'RADUNEYTI', 'RIKISADILI', 'SVEITARFELAG'
            );
          END IF;

          -- (b) Repoint the column off the old type onto the rebuilt enum,
          --     remapping data, then drop the old type. Runs right after (a),
          --     or on its own to finish an interrupted prior run.
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_sector_enum_old') THEN
            ALTER TABLE company ALTER COLUMN sector DROP DEFAULT;
            ALTER TABLE company
              ALTER COLUMN sector TYPE company_sector_enum
                USING (
                  CASE sector::text
                    WHEN 'PRIVATE' THEN 'FYRIRTAEKI'
                    WHEN 'PUBLIC' THEN
                      CASE
                        WHEN lower(coalesce(legal_form_id, legal_form_name, '')) LIKE 'sveitarf%'
                          OR lower(coalesce(legal_form_id, legal_form_name, '')) LIKE 'bygg%'
                        THEN 'SVEITARFELAG'
                        ELSE 'RIKISADILI'
                      END
                    ELSE 'UNKNOWN'
                  END::company_sector_enum
                );
            ALTER TABLE company ALTER COLUMN sector SET DEFAULT 'UNKNOWN';
            ALTER TABLE company ALTER COLUMN sector SET NOT NULL;
            DROP TYPE company_sector_enum_old;
          END IF;
        END $$;
      `)
    })
  },

  async down(queryInterface) {
    const sql = queryInterface.sequelize
    // Collapses back to the two-bucket enum. RADUNEYTI, RIKISADILI and
    // SVEITARFELAG all fold into PUBLIC — lossy in the same direction as
    // up() is, but the reverse of it: any RADUNEYTI/SVEITARFELAG distinction
    // made after this migration ran is discarded on rollback. Same
    // transaction + idempotency shape as up().
    await sql.transaction(async (transaction) => {
      const run = (text) => sql.query(text, { transaction })

      await run(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_enum e
              JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'company_sector_enum' AND e.enumlabel = 'FYRIRTAEKI'
          ) THEN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_sector_enum_old') THEN
              RAISE EXCEPTION 'company_sector_enum_old already exists alongside a live FYRIRTAEKI enum; resolve partial migration state manually';
            END IF;
            ALTER TYPE company_sector_enum RENAME TO company_sector_enum_old;
            CREATE TYPE company_sector_enum AS ENUM ('UNKNOWN', 'PRIVATE', 'PUBLIC');
          END IF;

          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_sector_enum_old') THEN
            ALTER TABLE company ALTER COLUMN sector DROP DEFAULT;
            ALTER TABLE company
              ALTER COLUMN sector TYPE company_sector_enum
                USING (
                  CASE sector::text
                    WHEN 'FYRIRTAEKI' THEN 'PRIVATE'
                    WHEN 'RADUNEYTI' THEN 'PUBLIC'
                    WHEN 'RIKISADILI' THEN 'PUBLIC'
                    WHEN 'SVEITARFELAG' THEN 'PUBLIC'
                    ELSE 'UNKNOWN'
                  END::company_sector_enum
                );
            ALTER TABLE company ALTER COLUMN sector SET DEFAULT 'UNKNOWN';
            ALTER TABLE company ALTER COLUMN sector SET NOT NULL;
            DROP TYPE company_sector_enum_old;
          END IF;
        END $$;
      `)
    })
  },
}
