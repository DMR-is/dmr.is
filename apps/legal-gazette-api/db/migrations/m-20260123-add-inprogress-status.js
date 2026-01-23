'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TYPE APPLICATION_STATUS ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      COMMIT;
    `)
  },
}
