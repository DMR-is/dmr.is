'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE user_role (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE admin_user (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      national_id VARCHAR NOT NULL,
      first_name VARCHAR NOT NULL,
      last_name VARCHAR NOT NULL,
      display_name VARCHAR NOT NULL,
      created TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
      PRIMARY KEY (id)
    );

    CREATE TABLE user_role_admin_user (
      user_role_id UUID NOT NULL,
      admin_user_id UUID NOT NULL,
      PRIMARY KEY (user_role_id, admin_user_id),
      CONSTRAINT fk_user_role_admin_user_user_role_id FOREIGN KEY (user_role_id) REFERENCES user_role (id),
      CONSTRAINT fk_user_role_admin_user_admin_user_id FOREIGN KEY (admin_user_id) REFERENCES admin_user (id)
    );

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
      CONSTRAINT fk_advert_involved_party_id FOREIGN KEY (involved_party_id) REFERENCES advert_involved_party (id),
      CONSTRAINT advert_serial_number_publication_year_department_unique UNIQUE (serial_number, publication_year, department_id)
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
      slug VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE case_tag (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE case_communication_status (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE case_comment_type (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE case_channel (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      email VARCHAR NOT NULL,
      phone VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE case_case (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      application_id UUID NOT NULL,
      year INTEGER NOT NULL,
      case_number VARCHAR NOT NULL,
      status_id UUID NOT NULL,
      tag_id UUID,
      involved_party_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      is_legacy BOOLEAN NOT NULL DEFAULT FALSE,
      assigned_user_id UUID,
      case_communication_status_id UUID,
      published_at TIMESTAMP WITH TIME ZONE,
      price INTEGER,
      paid BOOLEAN DEFAULT FALSE,
      fast_track BOOLEAN DEFAULT FALSE,
      department_id UUID NOT NULL,
      advert_title VARCHAR NOT NULL,
      message TEXT,
      advert_requested_publication_date TIMESTAMP WITH TIME ZONE,
      advert_type_id UUID NOT NULL,
      advert_html TEXT NOT NULL,
      CONSTRAINT fk_case_case_status_id FOREIGN KEY (status_id) REFERENCES case_status (id),
      CONSTRAINT fk_case_case_tag_id FOREIGN KEY (tag_id) REFERENCES case_tag (id),
      CONSTRAINT fk_case_case_involved_party_id FOREIGN KEY (involved_party_id) REFERENCES advert_involved_party (id),
      CONSTRAINT fk_case_case_communication_status_id FOREIGN KEY (case_communication_status_id) REFERENCES case_communication_status (id),
      CONSTRAINT fk_case_case_department_id FOREIGN KEY (department_id) REFERENCES advert_department (id),
      CONSTRAINT fk_case_case_advert_type_id FOREIGN KEY (advert_type_id) REFERENCES advert_type (id),
      PRIMARY KEY (id)
    );

    CREATE TABLE case_comment (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      case_id UUID NOT NULL,
      case_status_id UUID NOT NULL,
      type_id UUID NOT NULL,
      source VARCHAR NOT NULL,
      internal BOOLEAN DEFAULT TRUE,
      application_state JSONB,
      creator TEXT,
      receiver TEXT,
      comment TEXT,
      PRIMARY KEY (id),
      CONSTRAINT fk_case_comment_case_id FOREIGN KEY (case_id) REFERENCES case_case (id),
      CONSTRAINT fk_case_comment_case_status_id FOREIGN KEY (case_status_id) REFERENCES case_status (id),
      CONSTRAINT fk_case_comment_type_id FOREIGN KEY (type_id) REFERENCES case_comment_type (id)
    );

    CREATE TABLE case_categories (
      case_case_id UUID NOT NULL,
      category_id UUID NOT NULL,
      PRIMARY KEY (case_case_id, category_id),
      CONSTRAINT fk_case_categories_case_id FOREIGN KEY (case_case_id) REFERENCES case_case (id),
      CONSTRAINT fk_case_categories_category_id FOREIGN KEY (category_id) REFERENCES advert_category (id)
    );

    CREATE TABLE case_channels (
      case_case_id UUID NOT NULL,
      case_channel_id UUID NOT NULL,
      PRIMARY KEY (case_case_id, case_channel_id),
      CONSTRAINT fk_case_channels_case_id FOREIGN KEY (case_case_id) REFERENCES case_case (id),
      CONSTRAINT fk_case_channels_channel_id FOREIGN KEY (case_channel_id) REFERENCES case_channel (id)
    );

    CREATE TABLE case_comments (
      case_case_id UUID NOT NULL,
      case_comment_id UUID NOT NULL,
      PRIMARY KEY (case_case_id, case_comment_id),
      CONSTRAINT fk_case_comments_case_id FOREIGN KEY (case_case_id) REFERENCES case_case (id),
      CONSTRAINT fk_case_comments_comment_id FOREIGN KEY (case_comment_id) REFERENCES case_comment (id)
    );

    CREATE TABLE signature_type (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE signature_member (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      text_above VARCHAR,
      text_before VARCHAR,
      text_below VARCHAR,
      text_after VARCHAR,
      value VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE signature (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      type_id UUID NOT NULL,
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      institution VARCHAR NOT NULL,
      involved_party_id UUID NOT NULL,
      chairman_id UUID,
      additional_signature VARCHAR,
      html TEXT NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_signature_type_id FOREIGN KEY (type_id) REFERENCES signature_type (id),
      CONSTRAINT fk_signature_involved_party_id FOREIGN KEY (involved_party_id) REFERENCES advert_involved_party (id),
      CONSTRAINT fk_signature_chairman_id FOREIGN KEY (chairman_id) REFERENCES signature_member (id)
    );

    CREATE TABLE signature_members (
      signature_id UUID NOT NULL,
      signature_member_id UUID NOT NULL,
      PRIMARY KEY (signature_id, signature_member_id),
      CONSTRAINT fk_signature_members_signature_id FOREIGN KEY (signature_id) REFERENCES signature (id),
      CONSTRAINT fk_signature_members_member_id FOREIGN KEY (signature_member_id) REFERENCES signature_member (id)
    );

    CREATE TABLE case_signatures (
      case_case_id UUID NOT NULL,
      signature_id UUID NOT NULL,
      PRIMARY KEY (case_case_id, signature_id),
      CONSTRAINT fk_case_signatures_case_id FOREIGN KEY (case_case_id) REFERENCES case_case (id),
      CONSTRAINT fk_case_signatures_signature_id FOREIGN KEY (signature_id) REFERENCES signature (id)
    );

    CREATE TABLE advert_signatures (
      advert_id UUID NOT NULL,
      signature_id UUID NOT NULL,
      PRIMARY KEY (advert_id, signature_id),
      CONSTRAINT fk_advert_signatures_advert_id FOREIGN KEY (advert_id) REFERENCES advert (id),
      CONSTRAINT fk_advert_signatures_signature_id FOREIGN KEY (signature_id) REFERENCES signature (id)
    );

    CREATE TABLE application_attachment_type (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

    CREATE TABLE application_attachment (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      application_id UUID NOT NULL,
      original_file_name VARCHAR NOT NULL,
      file_name VARCHAR NOT NULL,
      file_format VARCHAR NOT NULL,
      file_extension VARCHAR NOT NULL,
      file_size INTEGER NOT NULL,
      file_location VARCHAR NOT NULL,
      type_id UUID NOT NULL,
      deleted BOOLEAN DEFAULT FALSE,
      PRIMARY KEY(id),
      CONSTRAINT fk_application_attachment_type_id FOREIGN KEY (type_id) REFERENCES application_attachment_type (id)
    );

    CREATE TABLE application_attachments (
      application_id UUID NOT NULL,
      attachment_id UUID NOT NULL,
      PRIMARY KEY (application_id, attachment_id),
      CONSTRAINT fk_application_attachments_application_id FOREIGN KEY (attachment_id) REFERENCES application_attachment (id)
    );

    CREATE TABLE case_attachments (
      case_case_id UUID NOT NULL,
      attachment_id UUID NOT NULL,
      PRIMARY KEY (case_case_id, attachment_id),
      CONSTRAINT fk_case_attachments_case_id FOREIGN KEY (case_case_id) REFERENCES case_case (id),
      CONSTRAINT fk_case_attachments_attachment_id FOREIGN KEY (attachment_id) REFERENCES application_attachment (id)
    );

    CREATE TABLE application_user (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      national_id VARCHAR NOT NULL,
      first_name VARCHAR NOT NULL,
      last_name VARCHAR NOT NULL,
      email VARCHAR,
      phone VARCHAR,
      created TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
      PRIMARY KEY (id)
    );

    CREATE TABLE application_user_involved_party (
      application_user_id UUID NOT NULL,
      involved_party_id UUID NOT NULL,
      PRIMARY KEY (application_user_id, involved_party_id),
      CONSTRAINT fk_application_user_involved_party_user_id FOREIGN KEY (application_user_id) REFERENCES application_user (id),
      CONSTRAINT fk_application_user_involved_party_involved_party_id FOREIGN KEY (involved_party_id) REFERENCES advert_involved_party (id)
    );

  COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    DROP TABLE IF EXISTS advert_categories CASCADE;
    DROP TABLE IF EXISTS advert_involved_party CASCADE;
    DROP TABLE IF EXISTS advert_status CASCADE;
    DROP TABLE IF EXISTS advert_category CASCADE;
    DROP TABLE IF EXISTS advert_main_category CASCADE;
    DROP TABLE IF EXISTS advert_type CASCADE;
    DROP TABLE IF EXISTS advert_department CASCADE;
    DROP TABLE IF EXISTS advert_attachments CASCADE;
	  DROP TABLE IF EXISTS advert CASCADE;
    DROP TABLE IF EXISTS category_department CASCADE;
    DROP TABLE IF EXISTS case_status CASCADE;
    DROP TABLE IF EXISTS case_tag CASCADE;
    DROP TABLE IF EXISTS case_communication_status CASCADE;
    DROP TABLE IF EXISTS case_comment_title CASCADE;
    DROP TABLE IF EXISTS case_comment_type CASCADE;
    DROP TABLE IF EXISTS case_comment_task CASCADE;
    DROP TABLE IF EXISTS case_comment CASCADE;
    DROP TABLE IF EXISTS case_case CASCADE;
    DROP TABLE IF EXISTS case_categories CASCADE;
    DROP TABLE IF EXISTS case_channel CASCADE;
    DROP TABLE IF EXISTS case_channels CASCADE;
    DROP TABLE IF EXISTS case_comments CASCADE;
    DROP TABLE IF EXISTS signature_type CASCADE;
    DROP TABLE IF EXISTS signature_member CASCADE;
    DROP TABLE IF EXISTS signature CASCADE;
    DROP TABLE IF EXISTS signature_member_signature CASCADE;
    DROP TABLE IF EXISTS case_signatures CASCADE;
    DROP TABLE IF EXISTS advert_signatures CASCADE;
    DROP TABLE IF EXISTS application_attachments CASCADE;
    DROP TABLE IF EXISTS case_attachments CASCADE;
    DROP TABLE IF EXISTS application_attachment CASCADE;
    DROP TABLE IF EXISTS application_attachment_type CASCADE;
    `)
  },
}
