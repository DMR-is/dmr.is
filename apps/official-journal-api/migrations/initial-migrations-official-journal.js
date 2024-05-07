'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE advert_department (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL UNIQUE,
      slug VARCHAR NOT NULL UNIQUE,
      created TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
      PRIMARY KEY (id)
    );

    CREATE TABLE advert_type (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL,
      department_id UUID NOT NULL,
      created TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
      legacy_id UUID,
      PRIMARY KEY (id),
      CONSTRAINT fk_advert_type_department_id FOREIGN KEY (department_id) REFERENCES advert_department (id),
      CONSTRAINT advert_type_title_slug_department_id_unique UNIQUE (title, slug, department_id)
    );

    -- "Yfirflokkur"
    CREATE TABLE advert_main_category (
        id UUID NOT NULL DEFAULT uuid_generate_v4(),
        title VARCHAR NOT NULL,
        slug VARCHAR NOT NULL,
        description VARCHAR NOT NULL,
        PRIMARY KEY (id)
    );

    CREATE TABLE advert_category (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL,
      main_category_id UUID NULL,
      created TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
      PRIMARY KEY (id),
      CONSTRAINT fk_advert_category_main_category_id FOREIGN KEY (main_category_id) REFERENCES advert_main_category (id)
    );

    CREATE TABLE advert_status (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE advert_involved_party (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL,
      created TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
      PRIMARY KEY (id)
    );

    CREATE TABLE advert (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      department_id UUID NOT NULL,
      type_id UUID NOT NULL,
      subject VARCHAR NOT NULL,
      status_id UUID NOT NULL,
      serial_number INTEGER NOT NULL CHECK (serial_number > 0),
      publication_year INTEGER NOT NULL CHECK (publication_year > 1900 AND publication_year < 2100),
      signature_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
      publication_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
      involved_party_id UUID NOT NULL,
      is_legacy BOOLEAN DEFAULT FALSE,
      document_html TEXT NOT NULL,
      document_pdf_url VARCHAR,
      created TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
      PRIMARY KEY (id),
      CONSTRAINT fk_advert_department_id FOREIGN KEY (department_id) REFERENCES advert_department (id),
      CONSTRAINT fk_advert_type_id FOREIGN KEY (type_id) REFERENCES advert_type (id),
      CONSTRAINT fk_advert_status_id FOREIGN KEY (status_id) REFERENCES advert_status (id),
      CONSTRAINT advert_serial_number_publication_year_department_unique UNIQUE (serial_number, publication_year, department_id)
    );

    CREATE TABLE advert_status_history (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      advert_id UUID NOT NULL,
      status_id UUID NOT NULL,
      created TIMESTAMP WITH TIME ZONE DEFAULT now(),
      -- TODO add user_id
      PRIMARY KEY (id),
      CONSTRAINT fk_advert_status_history_advert_id FOREIGN KEY (advert_id) REFERENCES advert (id),
      CONSTRAINT fk_advert_status_history_status_id FOREIGN KEY (status_id) REFERENCES advert_status (id)
    );



    CREATE TABLE advert_categories (
      advert_id UUID NOT NULL,
      category_id UUID NOT NULL,
      PRIMARY KEY (advert_id, category_id),
      CONSTRAINT fk_advert_categories_advert_id FOREIGN KEY (advert_id) REFERENCES advert (id),
      CONSTRAINT fk_advert_categories_category_id FOREIGN KEY (category_id) REFERENCES advert_category (id)
    );

    CREATE TABLE advert_attachments (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      advert_id UUID NOT NULL,
      name VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      url VARCHAR NOT NULL,
      PRIMARY KEY(id),
      CONSTRAINT fk_advert_attachments FOREIGN KEY(advert_id) REFERENCES advert(id)
    );

    CREATE TABLE category_department(
      category_id UUID NOT NUll,
      department_id UUID NOT NULL,
      PRIMARY KEY (category_id,department_id),
      CONSTRAINT fk_category_department_category_id FOREIGN KEY (category_id) REFERENCES advert_category(id),
      CONSTRAINT fk_category_department_department_id FOREIGN KEY (department_id) REFERENCES advert_department(id)
      );

    CREATE TABLE case_status (
        id UUID NOT NULL DEFAULT uuid_generate_v4(),
        title VARCHAR NOT NULL,
        value VARCHAR NOT NULL,
        PRIMARY KEY (id)
    );

  COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    DROP TABLE advert_categories CASCADE;
    DROP TABLE advert_status_history CASCADE;
    DROP TABLE advert_involved_party CASCADE;
    DROP TABLE advert_status CASCADE;
    DROP TABLE advert_category CASCADE;
    DROP TABLE advert_main_category CASCADE;
    DROP TABLE advert_type CASCADE;
    DROP TABLE advert_department CASCADE;
    DROP TABLE advert_attachments CASCADE;
	  DROP TABLE advert CASCADE;
    DROP TABLE category_department CASCADE;
    DROP TABLE case_status CASCADE;
    `)
  },
}
