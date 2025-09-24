'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const seed = `
      INSERT INTO
        TBR_FEE_CODE (id, fee_code, description, value, is_multiplied)
      VALUES
        ('5572d02f-3684-4849-9246-ac21a06e7f1f', 'RL101', 'Auglýsing - Áskorun', 4, true),
        ('6806b7df-9c94-4edd-8572-9b829d98b630', 'RL102', 'Auglýsing - Auglýsingar/tilkynningar frá ráðuneyti', 4, true),
        ('20996c70-e3b8-4375-94d4-14bcf4e6c7f9', 'RL103', 'Auglýsing - Auglýsing/tilkynning fjármálastarfsemi', 4, true),
        ('f8a4bb4f-d141-481b-91d2-026b2aa741d3', 'RL105', 'Auglýsing - Dómsbirting', 4, true),
        ('1d8481bb-b190-412d-aaca-4684f756a509', 'RL106', 'Auglýsing - Embætti, sýslanir, leyfi o.fl.', 4, true),
        ('4c1a0e38-08ac-4b3b-b731-5e2cbf20b9de', 'RL107', 'Auglýsing - Fasteigna-, fyrirtækja- og skipasala', 4, true),
        ('65351bcd-b765-4e75-8a31-8a8c61952737', 'RL108', 'Auglýsing - Félagsslit', 4, true),
        ('95e59d8f-dcd1-4328-8bb9-a412154d3953', 'RL109', 'Auglýsing - Firmaskrá', 1500, false),
        ('683f036c-6caa-4e79-971e-53f75eecf82d', 'RL110', 'Auglýsing - Framhald uppboðs', 4, true),
        ('fa519d2e-5215-4baf-a9e9-a82f4f76b64b', 'RL111', 'Auglýsing - Fyrirkall', 4, true),
        ('82bec6fb-739d-46ef-8ea3-ad55433f53dc', 'RL112', 'Auglýsing - Greiðsluáskorun', 4, true),
        ('8a25d324-133a-497b-bd93-3ec9ced46779', 'RL113', 'Auglýsing - Happdrætti', 4, true),
        ('4e9913b1-4cd3-4b0f-8d97-07e9c48bcb65', 'RL114', 'Auglýsing - Hlutafélög', 1500, false),
        ('7ac13ae6-6fd9-4c73-998c-710d6c719031', 'RL115', 'Auglýsing - Húsbréf', 4, true),
        ('baf87b5b-8e82-4c89-a76a-47517fc75c5e', 'RL116', 'Auglýsing - Innköllun', 4, true),
        ('9df17956-dfb3-4225-9d1c-65584fe922c2', 'RL117', 'Auglýsing - Kaupmáli', 4, true),
        ('3d2919f0-2bd5-42bf-ad51-5b68515d1911', 'RL118', 'Auglýsing - Laus störf, stöður, embætti o.fl.', 4, true),
        ('64f5ae87-7498-4024-88f9-8b67116a7d95', 'RL119', 'Auglýsing - Mat á umhverfisáhrifum', 4, true),
        ('192959a6-f3ee-436f-b47b-af5d64428423', 'RL120', 'Auglýsing - Nauðasamningar', 4, true),
        ('2fe8ac41-2af0-4ec6-90e7-4b87bbdf0520', 'RL124', 'Auglýsing - Skipulagsauglýsing', 4, true),
        ('cd1e51c0-f06a-491a-bdef-5c1b65a18624', 'RL125', 'Auglýsing - Starfsleyfi', 4, true),
        ('28fba7f8-32e0-4e1a-8a18-4ea3eced7f3b', 'RL126', 'Auglýsing - Stefna', 4, true),
        ('98cf3f6a-3c39-4245-8209-075126ec4cff', 'RL127', 'Auglýsing - Svipting fjárræðis', 4, true),
        ('248a8faf-cece-419a-844a-13f4f121909a', 'RL128', 'Auglýsing - Umferðarauglýsingar', 4, true),
        ('33b9d100-6559-491f-b5c3-5e288026705b', 'RL129', 'Auglýsing - Vátryggingafélagaskrá/vátr.miðlaraskrá', 4, true),
        ('bd49e7cf-d3aa-4832-bf36-b3938c889f77', 'RL130', 'Auglýsing - Veðhafafundur', 4, true),
        ('e29af28c-ce7b-4734-9e49-4ae77e01ff2a', 'RL131', 'Auglýsing - Ýmsar upplýsingar og tilkynningar', 4, true),
        ('a5921fcb-c98d-48c9-b40a-5f1e488df6ab', 'RL122', 'Auglýsing - Skiptafundur', 1500, false),
        ('ca4300e8-a372-4007-b834-efd73c14b9aa', 'RL123', 'Auglýsing - Skiptalok', 1500, false),
        ('2c15affd-18c5-4755-973c-6fbd1198aaf8', 'RL132', 'Auglýsing - Nauðungarsala', 1500, false),
        ('d454f3d3-30d4-4116-ad76-9c53923541a5', 'RL133', 'Auglýsing - Hlutafélagaskráning', 1500, false),
        ('2069f7b8-95a9-46ae-b0ab-9e646c035c71', 'RL134', 'Auglýsing - Firmaskráning', 1500, false),
        ('e024c0ec-b58b-4963-a0bb-85697cb6877a', 'RL135', 'Auglýsing - Innköllun þrotabús', 1500, false),
        ('df2d1084-0938-4e26-94b8-df39c3eafcc6', 'RL136', 'Auglýsing - Innköllun dánarbús', 1500, false),
        ('88887940-e2ad-4a9e-860d-363a8037f821', 'RL138', 'Auglýsing - Aukatilkynning hlutafélagaskrár', 1500, false),
        ('7ff20714-ae14-4850-9c34-b95e0a087cac', 'RL139', 'Auglýsing - Skiptalok skv. 154. grein', 1500, false),
        ('6fdbc2d6-1a6e-4669-a884-ed4df9dadbca', 'RL140', 'Auglýsing - Skiptalok skv. 155. grein', 1500, false),
        ('1d1c3b42-0aa0-4241-a03a-c824949bbb25', 'RL141', 'Auglýsing - Skiptalok þrotabú, annað', 1500, false),
        ('be50bdfc-02cf-4813-b8fb-9c11e4ea3cd9', 'RL142', 'Auglýsing - Skiptalok dánarbú', 1500, false),
        ('b1a82177-e4f8-4c6c-9c67-41ec30ea4660', 'RL143', 'Auglýsing - Skiptafundur þrotabú, frumvarp', 1500, false),
        ('6e7a2bf2-0f5b-448d-9536-ade2a777b99e', 'RL144', 'Auglýsing - Skiptafundur þrotabú, ekki frumvarp', 1500, false),
        ('7eba8bce-e926-4814-b5a4-e7ef980b3e3e', 'RL145', 'Auglýsing - Skiptafundur dánarbú, frumvarp', 1500, false),
        ('bd3dceb1-2e1a-4306-8cfe-b15fde4afcdf', 'RL146', 'Auglýsing - Skiptafundur dánarbú, annað', 1500, false),
        ('5541c4d7-bf09-49fd-a3c4-c2658699e3a3', 'RL147', 'Auglýsing - Skiptafundur þrotabú, annað', 1500, false),
        ('98123ac1-2e03-4fff-98f7-53665c1ce397', 'RL148', 'Auglýsing - Greiðsluaðlögun', 4, true),
        ('c173a784-9b92-4ca7-962c-89b75c80cf25', 'RL401', 'Áskrift - rafræn', 3000, false),
        ('70e32a20-730b-447d-abed-028ebd303ad8', 'RL402', 'Áskrift - prent', 82000, false),
        ('996c3a90-f2f3-43c2-8a4f-847823d90175', 'RL403', 'Prentað Lögbirtingablað', 802, false),
        ('f83a4e5c-e8f8-4a75-8257-0a2a91e131dd', 'RL404', 'Prent áskrift,  janúar - júní', 41000, false),
        ('26f4563c-fa83-4d8a-a6eb-17bcd534bed4', 'RL405', 'Prent áskrift,  júlí - desember', 41000, false),
        ('7d9bd40d-7e5d-4354-81dd-646bb0d04f09', 'RL901', 'Auglýsing, álag', 0, false),
        ('2749e2e4-eff7-4875-9aca-e264f5cf8476', 'RL902', 'Auglýsing, afsláttur', 0, false),
        ('26a0593d-f47d-46cd-96b3-432e036ce35f', 'RL903', 'Auglýsing, gjald v/fylgiskjals', 0, false);

      INSERT INTO
        ADVERT_TYPE_FEE_CODE (advert_type_id, fee_code_id)
      VALUES
        ('B480F220-AEB3-4A4E-844B-ADE0A76C1FC6', '33b9d100-6559-491f-b5c3-5e288026705b'), -- Vátryggingastarfsemi → Vátryggingafélagaskrá/vátr.miðlaraskrá (RL129)
        ('B4B31515-B759-44C9-88D2-F33DA574EA72', 'e29af28c-ce7b-4734-9e49-4ae77e01ff2a'), -- Ýmsar auglýsingar og tilkynningar → Ýmsar upplýsingar og tilkynningar (RL131)
        ('6E4317F5-DEBE-4617-854B-4B3B1FCB6AC7', '5572d02f-3684-4849-9246-ac21a06e7f1f'), -- Áskorun → RL101
        ('065C3FD9-58D1-436F-9FB8-C1F5C214FA50', 'e024c0ec-b58b-4963-a0bb-85697cb6877a'), -- Innköllun þrotabú → RL135
        ('508ED65B-17D3-4866-A40F-992DBA39F151', '64f5ae87-7498-4024-88f9-8b67116a7d95'), -- Mat á umhverfisáhrifum → RL119
        ('28F5F353-E0AD-4089-B575-ADB79F36C4B1', '1d8481bb-b190-412d-aaca-4684f756a509'), -- Embætti, sýslanir, leyfi o.fl. → RL106
        ('458ED90A-E3CA-4F2D-B8E0-06F7FCA1F773', 'f8a4bb4f-d141-481b-91d2-026b2aa741d3'), -- Dómsbirting → RL105
        ('EC153CBB-BB48-4984-9F96-5E26CC522DD3', '248a8faf-cece-419a-844a-13f4f121909a'), -- Umferðarauglýsingar → RL128
        ('8CF1CD80-4F20-497F-8992-B32424AB82D4', '88887940-e2ad-4a9e-860d-363a8037f821'), -- Aukatilkynning hlutafélaga → RL138
        ('393CE2F9-A766-4891-B22C-180DFDA1039E', '28fba7f8-32e0-4e1a-8a18-4ea3eced7f3b'), -- Stefna → RL126
        ('B390117B-A39A-4292-AE59-91295190F57D', '95e59d8f-dcd1-4328-8bb9-a412154d3953'), -- Firmaskrá → RL109
        ('1A2F84B7-970E-43FE-B05A-AF06D58CC2F9', 'cd1e51c0-f06a-491a-bdef-5c1b65a18624'), -- Starfsleyfi → RL125
        ('CE0490FA-9CC0-48B4-AD47-5964D081DCDF', '82bec6fb-739d-46ef-8ea3-ad55433f53dc'), -- Greiðsluáskorun → RL112
        ('82425CC8-B32E-4ADE-9EE4-BC6F8261B735', 'e29af28c-ce7b-4734-9e49-4ae77e01ff2a'), -- Almenn auglýsing → Ýmsar upplýsingar og tilkynningar (RL131)
        ('D86FCA7C-BF0A-41B3-B227-BD906C563D48', '8a25d324-133a-497b-bd93-3ec9ced46779'), -- Happdrætti → RL113
        ('0F7CDBF1-74AC-499B-9D9A-9010BEE3C4A3', 'baf87b5b-8e82-4c89-a76a-47517fc75c5e'), -- Innköllun → RL116
        ('CC18A165-B359-45B2-B587-AAE21A09B565', 'bd49e7cf-d3aa-4832-bf36-b3938c889f77'), -- Veðhafafundur → RL130
        ('44B873A0-21D2-4BCB-8351-9AEDAB4571AA', '2fe8ac41-2af0-4ec6-90e7-4b87bbdf0520'), -- Skipulagsauglýsing → RL124
        ('4E8DEC71-5270-49D8-BB67-B9A2CA5BEEAC', 'd454f3d3-30d4-4116-ad76-9c53923541a5'), -- Skráning hlutafélags → RL133
        ('BC6384F4-91B0-48FE-9A3A-B528B0AA6468', 'df2d1084-0938-4e26-94b8-df39c3eafcc6'), -- Innköllun dánarbú → RL136
        ('1FD87583-39F1-4405-8F8E-6053D0F93004', '9df17956-dfb3-4225-9d1c-65584fe922c2'), -- Kaupmáli → RL117
        ('D40BED80-6D9C-4388-AEA8-445B27614D8A', 'ca4300e8-a372-4007-b834-efd73c14b9aa'), -- Skiptalok → RL123
        ('F1A7CE20-37BE-451B-8AA7-BC90B8A7E7BD', 'a5921fcb-c98d-48c9-b40a-5f1e488df6ab'), -- Skiptafundur → RL122
        ('06F349CE-BDA5-43D5-AFAE-4D658ED17B51', '6806b7df-9c94-4edd-8572-9b829d98b630'), -- Ýmsar auglýsingar frá ráðuneytum → RL102
        ('861BFF25-B3C2-48C2-8AC5-CCFA61409552', '192959a6-f3ee-436f-b47b-af5d64428423'), -- Nauðasamningar → RL120
        ('E985DC6E-EB7D-4977-B2F9-A4D1569C67FF', '4e9913b1-4cd3-4b0f-8d97-07e9c48bcb65'), -- Hlutafélög → RL114
        ('2C75685D-7515-4B3A-AA32-A5DAB7F8926B', '683f036c-6caa-4e79-971e-53f75eecf82d'), -- Framhald uppboðs → RL110
        ('4B2D50F8-9BEC-46FA-95F9-FDCF8AC36391', '98cf3f6a-3c39-4245-8209-075126ec4cff'), -- Svipting fjárræðis → RL127
        ('6BD9C89E-8658-4EA0-A1CE-1948656EB4E7', '2c15affd-18c5-4755-973c-6fbd1198aaf8'), -- Nauðungarsala → RL132
        ('9910B500-094A-45D0-A6E1-299B860D672E', '3d2919f0-2bd5-42bf-ad51-5b68515d1911'), -- Laus störf, stöður, embætti o.fl. → RL118
        ('E24F0447-DE59-4EBB-B272-74F8D2469050', '4c1a0e38-08ac-4b3b-b731-5e2cbf20b9de'), -- Fasteigna-, fyrirtækja- og skipasala → RL107
        ('E35498BE-DA79-41D1-A2A0-CBEF3A51331C', 'fa519d2e-5215-4baf-a9e9-a82f4f76b64b'), -- Fyrirkall → RL111
        ('76C73F48-FC5C-46D3-AA41-71888EE44D8A', '65351bcd-b765-4e75-8a31-8a8c61952737'), -- Félagsslit → RL108
        ('A568EE24-CD88-453F-8F9A-85B5ADB22FC1', '20996c70-e3b8-4375-94d4-14bcf4e6c7f9'), -- Fjármálastarfsemi → RL103
        ('EE441D8C-6DEA-4BFF-931F-CBD9B8E29134', '7ac13ae6-6fd9-4c73-998c-710d6c719031'), -- Húsbréf → RL115
        ('91C5DBF4-13DB-441B-8174-BCF8366720FA', '98123ac1-2e03-4fff-98f7-53665c1ce397'); -- Greiðsluaðlögun → RL148

      `
    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`

      DELETE FROM ADVERT_TYPE_FEE_CODE;

      DELETE FROM TBR_FEE_CODE;
    `)
  },
}
