'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Alter CASE_ADDITIONS table
      ALTER TABLE CASE_ADDITIONS ADD COLUMN "order" INTEGER;

      -- Update the existing "order" column with incremented integers starting from 0 per case_case_id
      WITH RankedAdditions AS (
        SELECT
        addition_id,
        ROW_NUMBER() OVER (PARTITION BY case_case_id ORDER BY addition_id) - 1 AS row_num
        FROM CASE_ADDITIONS
      )
      UPDATE CASE_ADDITIONS
      SET "order" = RankedAdditions.row_num
      FROM RankedAdditions
      WHERE CASE_ADDITIONS.addition_id = RankedAdditions.addition_id;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Revert changes to CASE_ADDITIONS table
      ALTER TABLE CASE_ADDITIONS DROP COLUMN "order";
      
      COMMIT;
    `)
  },
}
