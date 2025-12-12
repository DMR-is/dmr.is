'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- This table holds settings for companies who get monthly TBR bills instead of per-issue billing.
      CREATE TABLE IF NOT EXISTS TBR_COMPANY_SETTINGS (
        ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        DELETED_AT TIMESTAMP WITH TIME ZONE,

        NAME TEXT NOT NULL,
        NATIONAL_ID TEXT UNIQUE NOT NULL,
        PHONE TEXT,
        EMAIL TEXT,
        ACTIVE BOOLEAN DEFAULT TRUE,
        CODE TEXT NOT NULL DEFAULT 'RL2'
      );

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP TABLE IF EXISTS TBR_COMPANY_SETTINGS;

      COMMIT;
    `)
  },
}
