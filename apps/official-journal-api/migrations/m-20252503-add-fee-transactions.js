'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

    -- Create fee code table
      CREATE TABLE IF NOT EXISTS APPLICATION_FEE_CODES (
        ID UUID NOT NULL DEFAULT UUID_GENERATE_V4(),
        FEE_CODE VARCHAR NOT NULL,
        DESCRIPTION VARCHAR NOT NULL,
        FEE_TYPE VARCHAR NOT NULL,
        VALUE NUMERIC NOT NULL,
        DEPARTMENT VARCHAR NOT NULL,
        PRIMARY KEY (ID)
      );

    -- Create transaction table
      CREATE TABLE IF NOT EXISTS CASE_TRANSACTION (
        ID UUID NOT NULL DEFAULT UUID_GENERATE_V4(),
        CASE_ID UUID NOT NULL UNIQUE,
        EXTERNAL_REFERENCE VARCHAR NOT NULL,
        TOTAL_PRICE NUMERIC NOT NULL,
        FEE_CODES TEXT[],
        CUSTOM_UNIT_BASE_COUNT NUMERIC,
        CUSTOM_UNIT_ADDITIONAL_CHARACTER_COUNT NUMERIC,
        CUSTOM_UNIT_ADDITIONAL_DOC_COUNT NUMERIC,
        IMAGE_TIER_CODE VARCHAR,
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (ID)
      );

    -- Alter CASE_CASE table
      ALTER TABLE CASE_CASE ADD COLUMN TRANSACTION_ID UUID NULL;
      ALTER TABLE CASE_CASE ADD CONSTRAINT FK_CASE_TRANSACTION FOREIGN KEY (TRANSACTION_ID) REFERENCES CASE_TRANSACTION (ID) ON DELETE RESTRICT;

    -- Remove columns PRICE and PAID from CASE_CASE table
      ALTER TABLE CASE_CASE DROP COLUMN IF EXISTS PRICE;
      ALTER TABLE CASE_CASE DROP COLUMN IF EXISTS PAID;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

       -- Remove foreign key column from CASE_CASE table
          ALTER TABLE CASE_CASE DROP CONSTRAINT IF EXISTS FK_CASE_TRANSACTION;
          ALTER TABLE CASE_CASE DROP COLUMN IF EXISTS TRANSACTION_ID;

        -- Delete transaction table
            DROP TABLE IF EXISTS CASE_TRANSACTION;

        -- Delete fee code table
            DROP TABLE IF EXISTS APPLICATION_FEE_CODES;

        -- Add back columns PRICE and PAID to CASE_CASE table
          ALTER TABLE CASE_CASE ADD COLUMN PRICE INTEGER;
          ALTER TABLE CASE_CASE ADD COLUMN PAID BOOLEAN DEFAULT FALSE;

      COMMIT;
    `)
  },
}
