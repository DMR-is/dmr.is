'use strict'

/**
 * Widens `scoring_sub_criterion.weight` so a legal value fits.
 *
 * `NUMERIC(6,4)` holds at most 99.9999. A model may legitimately have a single
 * sub-criterion carrying the whole distribution — `weight: 100` — and that
 * value overflowed the column, so the API answered a Postgres 500 rather than
 * accepting a perfectly valid model. `NUMERIC(7,4)` holds it with the same four
 * decimal places.
 *
 * The DTO now carries `@Min(0) @Max(100)` as well, which is what turns anything
 * *outside* the range into a 400 instead of reaching the column at all. The two
 * changes are a pair: the bound decides what is legal, this decides that what
 * is legal can be stored.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE scoring_sub_criterion
        ALTER COLUMN weight TYPE NUMERIC(7, 4);

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      -- Narrowing back would fail on any row already at 100. Rounding those
      -- down would silently change a filed model's weights, so the down
      -- migration refuses instead.
      ALTER TABLE scoring_sub_criterion
        ALTER COLUMN weight TYPE NUMERIC(6, 4);

      COMMIT;
    `)
  },
}
