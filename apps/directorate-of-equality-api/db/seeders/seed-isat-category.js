'use strict'

const fs = require('fs')
const path = require('path')

// ÍSAT2008 reference data — 665 leaf (5-digit / two-dot) codes. See db/README.md.
// Source: db/seeders/data/isat-2008.json (cleaned from the Hagstofan export).

const escStr = (s) => `'${String(s).replace(/'/g, "''")}'`

function isatCategorySql() {
  const rows = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'isat-2008.json'), 'utf8'),
  )

  // `section` / `division` are derived from the code rather than carried in the
  // JSON, using the same isat_section_for_code() function the migration used to
  // backfill existing rows — one source of truth for the division → section
  // mapping. An ÍSAT code whose division is outside NACE Rev. 2 yields NULL and
  // trips the NOT NULL constraint, which is the intended loud failure.
  const values = rows
    .map(
      (r) =>
        `(${escStr(r.isat2008_normalized)}, ${escStr(r.isat2008)}, ` +
        `${escStr(r.description)}, ${escStr(r.description_en)}, ` +
        `isat_section_for_code(${escStr(r.isat2008_normalized)}), ` +
        `substring(${escStr(r.isat2008_normalized)} FROM 1 FOR 2))`,
    )
    .join(',\n      ')

  return `
    BEGIN;

    INSERT INTO isat_category (
      code, code_dotted, description, description_en, section, division
    )
    VALUES
      ${values}
    ON CONFLICT (code) DO NOTHING;

    COMMIT;
  `
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(isatCategorySql())
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`DELETE FROM isat_category;`)
  },
}
