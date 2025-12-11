'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Create subscriber_payments table
      CREATE TABLE SUBSCRIBER_PAYMENTS (
        ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        SUBSCRIBER_ID UUID NOT NULL UNIQUE REFERENCES LEGAL_GAZETTE_SUBSCRIBERS(ID) ON DELETE CASCADE,
        AMOUNT NUMERIC NOT NULL,
        CHARGE_BASE TEXT NOT NULL,
        CHARGE_CATEGORY TEXT NOT NULL,
        FEE_CODE TEXT NOT NULL,
        PAID_AT TIMESTAMP WITH TIME ZONE,
        CREATED TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        MODIFIED TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create index on subscriber_id for faster lookups
      CREATE INDEX idx_subscriber_payments_subscriber_id ON SUBSCRIBER_PAYMENTS(SUBSCRIBER_ID);

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Drop subscriber_payments table
      DROP TABLE IF EXISTS SUBSCRIBER_PAYMENTS;

      COMMIT;
    `)
  },
}
