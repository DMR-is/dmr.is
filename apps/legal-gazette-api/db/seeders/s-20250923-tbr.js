'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const seed = `
      INSERT INTO
        TBR_FEE_CODES (fee_code, description, value, is_multiplied)
      VALUES
        ('RL101', 'Auglýsing - Áskorun', 4, true),
        ('RL102', 'Auglýsing - Auglýsingar/tilkynningar frá ráðuneyti', 4, true),
        ('RL103', 'Auglýsing - Auglýsing/tilkynning fjármálastarfsemi', 4, true),
        ('RL105', 'Auglýsing - Dómsbirting', 4, true),
        ('RL106', 'Auglýsing - Embætti, sýslanir, leyfi o.fl.', 4, true),
        ('RL107', 'Auglýsing - Fasteigna-, fyrirtækja- og skipasala', 4, true),
        ('RL108', 'Auglýsing - Félagsslit', 4, true),
        ('RL110', 'Auglýsing - Framhald uppboðs', 4, true),
        ('RL111', 'Auglýsing - Fyrirkall', 4, true),
        ('RL112', 'Auglýsing - Greiðsluáskorun', 4, true),
        ('RL113', 'Auglýsing - Happdrætti', 4, true),
        ('RL115', 'Auglýsing - Húsbréf', 4, true),
        ('RL116', 'Auglýsing - Innköllun', 4, true),
        ('RL117', 'Auglýsing - Kaupmáli', 4, true),
        ('RL118', 'Auglýsing - Laus störf, stöður, embætti o.fl.', 4, true),
        ('RL119', 'Auglýsing - Mat á umhverfisáhrifum', 4, true),
        ('RL120', 'Auglýsing - Nauðasamningar', 4, true),
        ('RL124', 'Auglýsing - Skipulagsauglýsing', 4, true),
        ('RL125', 'Auglýsing - Starfsleyfi', 4, true),
        ('RL126', 'Auglýsing - Stefna', 4, true),
        ('RL127', 'Auglýsing - Svipting fjárræðis', 4, true),
        ('RL128', 'Auglýsing - Umferðarauglýsingar', 4, true),
        ('RL129', 'Auglýsing - Vátryggingafélagaskrá/vátr.miðlaraskrá', 4, true),
        ('RL130', 'Auglýsing - Veðhafafundur', 4, true),
        ('RL131', 'Auglýsing - Ýmsar upplýsingar og tilkynningar', 4, true),
        ('RL109', 'Auglýsing - Firmaskrá', 1500, false),
        ('RL114', 'Auglýsing - Hlutafélög', 1500, false),
        ('RL122', 'Auglýsing - Skiptafundur', 1500, false),
        ('RL123', 'Auglýsing - Skiptalok', 1500, false),
        ('RL132', 'Auglýsing - Nauðungarsala', 1500, false),
        ('RL133', 'Auglýsing - Hlutafélagaskráning', 1500, false),
        ('RL134', 'Auglýsing - Firmaskráning', 1500, false),
        ('RL135', 'Auglýsing - Innköllun þrotabús', 1500, false),
        ('RL136', 'Auglýsing - Innköllun dánarbús', 1500, false),
        ('RL138', 'Auglýsing - Aukatilkynning hlutafélagaskrár', 1500, false),
        ('RL139', 'Auglýsing - Skiptalok skv. 154. grein', 1500, false),
        ('RL140', 'Auglýsing - Skiptalok skv. 155. grein', 1500, false),
        ('RL141', 'Auglýsing - Skiptalok þrotabú, annað', 1500, false),
        ('RL142', 'Auglýsing - Skiptalok dánarbú', 1500, false),
        ('RL143', 'Auglýsing - Skiptafundur þrotabú, frumvarp', 1500, false),
        ('RL144', 'Auglýsing - Skiptafundur þrotabú, ekki frumvarp', 1500, false),
        ('RL145', 'Auglýsing - Skiptafundur dánarbú, frumvarp', 1500, false),
        ('RL146', 'Auglýsing - Skiptafundur dánarbú, annað', 1500, false),
        ('RL147', 'Auglýsing - Skiptafundur þrotabú, annað', 1500, false),
        ('RL148', 'Auglýsing - Greiðsluaðlögun', 4, true),
        ('RL401', 'Áskrift - rafræn', 3000, false),
        ('RL403', 'Prentað Lögbirtingablað', 802, false),
        ('RL404', 'Prent áskrift,  janúar - júní', 41000, false),
        ('RL405', 'Prent áskrift,  júlí - desember', 41000, false),
        ('RL402', 'Áskrift - prent', 82000, false),
        ('RL901', 'Auglýsing, álag', 0, false),
        ('RL902', 'Auglýsing, afsláttur', 0, false),
        ('RL903', 'Auglýsing, gjald v/fylgiskjals', 0, false);
      `
    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      DELETE FROM TBR_FEE_CODES;
    `)
  },
}
