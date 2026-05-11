'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TYPE report_event_type_enum ADD VALUE IF NOT EXISTS 'UNASSIGNED';

      COMMIT;
    `)
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      COMMIT;
    `)
  },
}
