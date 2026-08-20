'use strict'

const { cwd } = require('process')
const { readFile } = require('fs/promises')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())

    // ⚠️ ON CONFLICT DO NOTHING on both inserts, because this seeder is NOT
    // idempotent by default and nothing makes it so: `sequelize.config.js` sets
    // no `seederStorage`, which defaults to 'none', so `db:seed:all` re-runs
    // every seeder on every `dev-init`. Both tables below also survive the
    // `TRUNCATE report CASCADE` in m-20260820-report-employee-paid-hours (that
    // truncate deliberately spares doe_user, config and company), so a second
    // dev-init used to die on a duplicate primary key before reaching the
    // scenario seeders.

    const seed = `
      BEGIN;

      INSERT INTO
        DOE_USER (
          ID,
          NATIONAL_ID,
          FIRST_NAME,
          LAST_NAME,
          EMAIL,
          PHONE,
          IS_ACTIVE
        )
      VALUES
        (
          'b4e98cee-a4d8-4924-90df-b820c4bc0801',
          '0101302399',
          'Gervimaður',
          'Færeyjar',
          'gm@faereyjar.is',
          '555-1234',
          TRUE
        )
      ON CONFLICT (ID) DO NOTHING;

      INSERT INTO
        CONFIG (
          ID,
          KEY,
          VALUE,
          DESCRIPTION
        )
      VALUES
        (
          'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          'salary_difference_threshold_percent',
          '3.9',
          'Annual gender salary difference threshold (%). Updated each February.'
        )
      ON CONFLICT (ID) DO NOTHING;

COMMIT;
      `

    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;

      COMMIT;
    `)
  },
}
