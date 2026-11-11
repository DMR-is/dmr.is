'use strict'

/**
 * Gives every report with no `provider_id` an opaque one under SYSTEM, so the
 * company it was filed for can find and read it on My Pages.
 *
 * The company's submissions list (`GET /application/reports`) and its read
 * routes open a report by a handle built from `(provider_type, provider_id)`:
 * the island.is application id, `partner:<firm's id>`, or `system:<id>` for a
 * report Jafnréttisstofa entered. A row with no `provider_id` has no handle at
 * all, so it could not be listed. The admin web already sends a random id
 * under SYSTEM; this covers rows created before it did, or by a direct call,
 * and `ReportCreateService` mints the same way for new ones (`withReadHandle`).
 *
 * The id is a fresh UUID, never `report.id`: the applicant must not see the
 * DoE-side id. The provider type becomes SYSTEM even where another was stored,
 * because an ISLAND_IS or OTHER row carrying an id that island.is or a firm
 * never issued would be reachable through that channel's write routes. Such a
 * row came from no upstream channel, so SYSTEM is what it is.
 *
 * Fits `report_provider_type_provider_id_unique_idx` (partial, provider_id NOT
 * NULL): every minted id is new.
 *
 * The down migration cannot tell a minted id from one a caller sent, so it is a
 * no-op: the ids are harmless, and nulling them again would hide those reports
 * from the company.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE report
         SET provider_type = 'SYSTEM',
             provider_id = gen_random_uuid()::text
       WHERE provider_id IS NULL;
    `)
  },

  async down() {
    // Intentionally irreversible; see the header.
  },
}
