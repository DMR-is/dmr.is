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
      NATIONAL_ID TEXT NOT NULL,
      PHONE TEXT,
      EMAIL TEXT,
      ACTIVE BOOLEAN DEFAULT TRUE,
      CODE TEXT NOT NULL DEFAULT 'RL2'
      );

      CREATE OR REPLACE FUNCTION normalize_tbr_company_settings_values() RETURNS TRIGGER AS $$
      BEGIN
      IF NEW.NATIONAL_ID IS NOT NULL THEN
        NEW.NATIONAL_ID := UPPER(TRIM(REPLACE(REPLACE(NEW.NATIONAL_ID, ' ', ''), '-', '')));
      END IF;

      IF NEW.EMAIL IS NOT NULL THEN
        NEW.EMAIL := LOWER(TRIM(NEW.EMAIL));
      END IF;

      IF NEW.PHONE IS NOT NULL THEN
        NEW.PHONE := TRIM(REPLACE(REPLACE(NEW.PHONE, ' ', ''), '-', ''));
      END IF;

      RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER normalize_tbr_company_settings_trigger
      BEFORE INSERT OR UPDATE ON TBR_COMPANY_SETTINGS
      FOR EACH ROW EXECUTE FUNCTION normalize_tbr_company_settings_values();

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
