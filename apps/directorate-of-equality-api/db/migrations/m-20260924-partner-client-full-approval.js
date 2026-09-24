'use strict'

/**
 * Widens every live vendor client to the full scope set.
 *
 * Approval became all or nothing: a firm is approved for every scope, and a
 * delegation granted on the self-service web copies the firm's approval. Firms
 * approved before that — whose admin modal defaulted to filing only — would
 * otherwise hand every new delegation a set without `scoring:write`, while the
 * consent screen tells the company the firm may author its starfsmat. No
 * endpoint changes a firm's scopes, and re-approving creates a new client id
 * that orphans its delegations, so this is the only way to widen them.
 *
 * Firms only. Approving a firm is Jafnréttisstofa's own commercial decision, so
 * widening it is too. Company keys and delegations are grants a company made
 * itself and are deliberately left as they are.
 *
 * Revoked firms are untouched: their row is an audit record, and they
 * authenticate nowhere whatever they hold.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE doe_partner_client
      SET scopes = ARRAY['report:read', 'salary:submit', 'equality:submit', 'scoring:write']::text[],
          updated_at = now()
      WHERE revoked_at IS NULL
        AND NOT (scopes @> ARRAY['report:read', 'salary:submit', 'equality:submit', 'scoring:write']::text[]);
    `)
  },

  async down() {
    // Deliberately a no-op: which firms were narrower, and how, is not
    // recorded anywhere to restore from. Narrowing every firm back to the old
    // default would also strip `scoring:write` from firms an admin approved
    // with it on purpose.
  },
}
