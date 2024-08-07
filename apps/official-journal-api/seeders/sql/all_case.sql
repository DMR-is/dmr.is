INSERT INTO case_status (id, key, value) VALUES ('799722be-5530-439a-91dc-606e129b030d', 'Submitted', 'Innsent');
INSERT INTO case_status (id, key, value) VALUES ('e926beb2-4001-4315-aed9-e4eec2ca963d', 'InProgress', 'Grunnvinnsla');
INSERT INTO case_status (id, key, value) VALUES ('22b038c1-1d8b-4a01-b061-02f22358d17e', 'InReview', 'Yfirlestur');
INSERT INTO case_status (id, key, value) VALUES ('a90d65b7-905f-4ebb-aa1d-7fa115d91d56', 'ReadyForPublishing', 'Tilbúið');
INSERT INTO case_status (id, key, value) VALUES ('cd1536de-4481-492f-8db1-1ea0e3e38880', 'Published', 'Útgefið');
INSERT INTO case_status (id, key, value) VALUES ('c2b24d63-e5d9-417f-8ec1-ef5150e1a17f', 'Unpublished', 'Tekið úr birtingu');
INSERT INTO case_status (id, key, value) VALUES ('a8668645-ef72-4f2d-8e75-7bfe65b0123c', 'Rejected', 'Birtingu hafnað');

INSERT INTO case_tag (id, key, value) VALUES ('08f2c487-2407-470b-bef3-72c9e0afb328', 'NotStarted', 'Ekki hafið');
INSERT INTO case_tag (id, key, value) VALUES ('480853f2-a511-41b5-b663-df655741e77a', 'InReview', 'Í yfirlestri');
INSERT INTO case_tag (id, key, value) VALUES ('ec3849a2-2405-4459-a9e3-baf17f894e7b', 'MultipleReviewers', 'Samlesin');
INSERT INTO case_tag (id, key, value) VALUES ('8555af9f-96be-4320-8c51-e96e8d7010a9', 'RequiresReview', 'Þarf skoðun');

INSERT INTO case_communication_status (id, key, value) VALUES ('a96edcf2-97c5-427d-99e5-8de76c887e07', 'NotStarted', 'Ekki hafin');
INSERT INTO case_communication_status (id, key, value) VALUES ('01b1e30a-a3e9-4499-aae5-379c8f965dd2', 'WaitingForAnswers', 'Beðið eftir svörum');
INSERT INTO case_communication_status (id, key, value) VALUES ('a253814d-2ef5-4321-96ff-301967b6509b', 'HasAnswers', 'Svör hafa borist');
INSERT INTO case_communication_status (id, key, value) VALUES ('904d562b-079c-4419-8019-c054fb422892', 'Done', 'Lokið');

INSERT INTO case_comment_title (id, key, value) VALUES ('d1e1377d-2d01-4a5a-999f-cdb1ec0cfc17', 'Submit', 'Innsent af:');
INSERT INTO case_comment_title (id, key, value) VALUES ('cf8ce92b-8838-4a76-8fb3-956ce35bca3b', 'AssignSelf', 'merkir sér málið.');
INSERT INTO case_comment_title (id, key, value) VALUES ('bad8a244-9f02-4799-a3fc-bf652f6cf7fd', 'Assign', 'færir mál á');
INSERT INTO case_comment_title (id, key, value) VALUES ('84237319-b317-4ac4-a4cf-724b5d9bbed6', 'UpdateStatus', 'færir mál í stöðuna:');
INSERT INTO case_comment_title (id, key, value) VALUES ('72dbba56-6808-4344-883f-48e67783ab49', 'Comment', 'gerir athugasemd.');
INSERT INTO case_comment_title (id, key, value) VALUES ('a303587f-7cad-4f43-960d-e66d094a28b5', 'Message', 'skráir skilaboð');

INSERT INTO case_comment_type (id, key, value) VALUES ('6c28e8ff-63f6-4cfc-81f0-2835def7d021', 'Submit', 'submit');
INSERT INTO case_comment_type (id, key, value) VALUES ('be3b0ccd-51c8-4e96-8957-485bc35c8568', 'Assign', 'assign');
INSERT INTO case_comment_type (id, key, value) VALUES ('6c296957-6aab-447a-9706-9c3d54d0f03d', 'Assign', 'assign_self');
INSERT INTO case_comment_type (id, key, value) VALUES ('e34f7bf2-a7e7-4147-9b8b-1ca232f26952', 'Update', 'update');
INSERT INTO case_comment_type (id, key, value) VALUES ('755b2a15-9a64-41ef-a53e-b73688d71440', 'Comment', 'comment');
INSERT INTO case_comment_type (id, key, value) VALUES ('771cffc9-cc84-42a4-8b06-6ef51ee489e4', 'Message', 'message');

INSERT INTO signature_type (id, title, slug) VALUES ('1b15e5a8-a548-4d0e-a79f-0c8d50520d29', 'Hefðbundin undirritun', 'hefdbundin-undirritun');
INSERT INTO signature_type (id, title, slug) VALUES ('b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e', 'Undirritun nefndar', 'undirritun-nefndar');

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '9d89fa7d-d3c6-4eeb-bd24-73b3bc4c5e12',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202207002',
    '799722be-5530-439a-91dc-606e129b030d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '34110436-6CC5-486F-9A29-0829D8E093AD',
    '2022-07-02T22:29:24.854Z',
    '2022-07-02T22:29:24.854Z',
    true,
    NULL,
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    'E31B4A73-CDF2-494D-A986-26B76B776658',
    'Norðurorku fyrir heitt vatn.',
    '2022-07-13T07:05:01.192Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9d89fa7d-d3c6-4eeb-bd24-73b3bc4c5e12','5D451470-17B4-449E-AD97-34CBEA1B2CFA');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9d89fa7d-d3c6-4eeb-bd24-73b3bc4c5e12','4D86B4A6-2A59-491B-B9C8-A5EB86C81601');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9d89fa7d-d3c6-4eeb-bd24-73b3bc4c5e12','597A8D1C-C339-43E9-9BFC-4A9A00FE33D5');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '82f8ca9c-ce53-4168-a208-51f64468fbc3',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202312023',
    '799722be-5530-439a-91dc-606e129b030d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '413D09B6-177A-4D40-94B7-2857B0EF4018',
    '2023-12-23T23:13:10.633Z',
    '2023-12-23T23:13:10.633Z',
    true,
    NULL,
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '8C5AD844-0736-4CE1-B080-6E30B13226DA',
    'um stjórn og fundarsköp Húnaþings vestra.',
    '2023-12-25T15:06:48.702Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('82f8ca9c-ce53-4168-a208-51f64468fbc3','E0BCCA12-B47E-44E1-9CFE-EDB712E8F731');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('82f8ca9c-ce53-4168-a208-51f64468fbc3','C7B722B8-915E-4C50-ACE4-32A4DADDF75F');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('82f8ca9c-ce53-4168-a208-51f64468fbc3','FE0D469D-EF14-417D-ADFC-2CAB313B023E');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('82f8ca9c-ce53-4168-a208-51f64468fbc3','10F3C0FB-7D9B-4C26-9466-1D83579476CD');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '61ab9809-f707-4f7d-b318-07690f8301bd',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202306020',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'B343A3D4-09F8-426F-9482-DEC18CAC506E',
    '2023-06-20T22:24:20.219Z',
    '2023-06-20T22:24:20.219Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '3570C3D6-4466-4C29-A611-DB3C73A79D6A',
    'fyrir aukasorpgjöld í Hrunamannahreppi.',
    '2023-07-16T11:14:19.694Z',
    NULL
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '87cac683-2db2-4796-b0a2-c7f01891de6f',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202207028',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '3305E90C-2851-440C-B070-EF1FBE792D13',
    '2022-07-28T16:51:40.028Z',
    '2022-07-28T16:51:40.028Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um breytingar á deiliskipulagsáætlunum í Reykjavík.',
    '2022-08-04T18:11:51.018Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('87cac683-2db2-4796-b0a2-c7f01891de6f','20112041-144B-485D-B1CA-261946A8EAE9');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('87cac683-2db2-4796-b0a2-c7f01891de6f','07FAFC03-9393-4257-9D10-B97C59CD1E94');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('87cac683-2db2-4796-b0a2-c7f01891de6f','D75C049B-7EED-42DF-9C54-C92A28E1ABF6');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('87cac683-2db2-4796-b0a2-c7f01891de6f','E5F49B58-B742-4944-B767-03AD6FA156CA');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('87cac683-2db2-4796-b0a2-c7f01891de6f','88E9ECF7-9CFD-4B6C-93DE-598889E39E5F');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    'f3c2247d-8b13-4f5e-8d40-5cfd2978687d',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202401008',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'DAB943D8-2660-4B86-B61B-15E4BAB7CA59',
    '2024-01-08T04:37:30.329Z',
    '2024-01-08T04:37:30.329Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um bann við lausagöngu stórgripa á Fljótsdalshéraði.',
    '2024-01-15T12:31:21.978Z',
    NULL
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '169db05c-8492-4b77-aa15-c73042ce3c0e',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202208004',
    '799722be-5530-439a-91dc-606e129b030d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'DE4679EB-C244-4D90-87AC-ADB7FEB00BC1',
    '2022-08-04T18:12:51.555Z',
    '2022-08-04T18:12:51.555Z',
    true,
    NULL,
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'fyrir hundahald á Hvolsvelli árið 2006.',
    '2022-08-18T00:43:56.590Z',
    NULL
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '2fadfe86-0b86-42be-ba6b-9fc673e92232',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202208023',
    'cd1536de-4481-492f-8db1-1ea0e3e38880',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'CED4B0F0-DE60-4A5E-A48C-58EE186E667D',
    '2022-08-23T05:53:58.267Z',
    '2022-08-23T05:53:58.267Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '9a5ca55f-66c5-4c63-8e69-da8f58c829c4',
    'um hækkun hunda- og kattaleyfisgjalda í Fjarðabyggð.',
    '2022-08-27T05:43:23.145Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2fadfe86-0b86-42be-ba6b-9fc673e92232','BB19B0F4-6DF9-49A4-8DC4-E48F35BC67A5');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2fadfe86-0b86-42be-ba6b-9fc673e92232','347B324D-EB98-4206-925D-25569F0293D4');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2fadfe86-0b86-42be-ba6b-9fc673e92232','F125465F-6197-4CCB-977B-1CF32E03D2A7');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2fadfe86-0b86-42be-ba6b-9fc673e92232','82A214D0-B663-4245-80C6-6656AAC1EA69');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2fadfe86-0b86-42be-ba6b-9fc673e92232','0B2A5522-8182-45DD-BEDB-CC382C13749E');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '68c23b20-7722-40e1-b30b-8c501fb198c5',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202305002',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '99E0580E-5884-4606-8EA0-5D3B18E2BF07',
    '2023-05-02T23:53:29.892Z',
    '2023-05-02T23:53:29.892Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'fyrir vatnsgjald og stofngjald vatnsveitu í Borgarfjarðarhreppi.',
    '2023-05-29T04:30:28.078Z',
    NULL
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '0d47c9bd-5b59-4684-ba9a-b3213c242a4d',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202405026',
    'cd1536de-4481-492f-8db1-1ea0e3e38880',
    '480853f2-a511-41b5-b663-df655741e77a',
    '75129AFB-7875-49C9-BEBE-A25BDB0AC3E4',
    '2024-05-26T11:40:03.536Z',
    '2024-05-26T11:40:03.536Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    'e037a62a-b10b-4c6b-befb-139ed807a2c0',
    'um deiliskipulag í Borgarfjarðarsveit.',
    '2024-06-06T06:19:08.688Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0d47c9bd-5b59-4684-ba9a-b3213c242a4d','8C0F5C5C-236D-48E2-B7A8-69308A443CD3');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0d47c9bd-5b59-4684-ba9a-b3213c242a4d','EA749F4E-F99D-480D-80A1-F44D96316589');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '29cf47b2-7038-403d-9297-e69a448084b2',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202301016',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '3FF59F3D-65D3-4E68-8700-8E9C30FD1F93',
    '2023-01-16T23:35:04.152Z',
    '2023-01-16T23:35:04.152Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um (1.) breytingu á reglugerð nr. 892/2004 um lækningatæki.',
    '2023-02-05T16:18:07.359Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('29cf47b2-7038-403d-9297-e69a448084b2','5C03F2DE-0503-4924-BB9F-4178CE122A28');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('29cf47b2-7038-403d-9297-e69a448084b2','F0B8FDB6-D8BF-4168-9D4C-AFC2F49A5228');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('29cf47b2-7038-403d-9297-e69a448084b2','20112041-144B-485D-B1CA-261946A8EAE9');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '8fc9c843-e5c2-40ff-a1fe-ff0331c74960',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202406026',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '52EBA54E-DE71-4E01-BA8E-FCAA48BB5688',
    '2024-06-26T20:46:17.770Z',
    '2024-06-26T20:46:17.770Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '55B8DE56-7F38-4655-995F-6AA9F394E734',
    'um breytingar á deiliskipulagsáætlunum í Reykjavík.',
    '2024-07-01T17:30:54.175Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('8fc9c843-e5c2-40ff-a1fe-ff0331c74960','62CB4BAF-5C3C-4664-88AA-D90B5B3B3B2E');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('8fc9c843-e5c2-40ff-a1fe-ff0331c74960','62AEA010-42D1-441A-A504-B75DA9070BCB');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('8fc9c843-e5c2-40ff-a1fe-ff0331c74960','5D224044-CF5E-44FA-B923-890CF7398919');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('8fc9c843-e5c2-40ff-a1fe-ff0331c74960','E83F6749-40D8-46BE-BDF4-4FE16BBCE309');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '1cc2dba5-79b5-4a01-84b4-25bf98204b23',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202301030',
    'cd1536de-4481-492f-8db1-1ea0e3e38880',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'FC868F9D-FDF1-488B-B7C9-9A2CEA09062E',
    '2023-01-30T12:06:07.744Z',
    '2023-01-30T12:06:07.744Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    'D3DBFEAD-749D-4A0B-9C6B-217DCD0D48BE',
    'um gerð og staðsetningu skilta í Vestmannaeyjum.',
    '2023-02-14T11:51:32.054Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('1cc2dba5-79b5-4a01-84b4-25bf98204b23','8B90EFF2-82A0-4282-9F5C-EABD2DBAC044');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('1cc2dba5-79b5-4a01-84b4-25bf98204b23','0496255B-5ABE-4717-A15F-F2C8E8862DC6');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '0c557bbb-7f45-45b1-a030-908a759b4c2c',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202404004',
    '799722be-5530-439a-91dc-606e129b030d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '35F71C66-6544-4534-876C-B4456A45C5ED',
    '2024-04-04T15:01:43.224Z',
    '2024-04-04T15:01:43.224Z',
    false,
    NULL,
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um breytingu á reglugerð nr. 132, 17. febrúar 2006, um hrognkelsaveiðar.',
    '2024-04-06T22:32:54.363Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0c557bbb-7f45-45b1-a030-908a759b4c2c','2452649B-DEF6-4E31-B1A8-D0453620BF9B');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0c557bbb-7f45-45b1-a030-908a759b4c2c','9DFECF63-1405-420D-836F-C71311B1F48B');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0c557bbb-7f45-45b1-a030-908a759b4c2c','CE3594B6-3EEC-4CC9-A53C-B50E88545C50');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0c557bbb-7f45-45b1-a030-908a759b4c2c','9278B56A-A552-43B5-A833-C32B9A122F67');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '49453da4-e878-4ef6-8301-20a6095429d0',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202202004',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '1696D37C-89A5-41F0-AAF7-4F4387F71CF3',
    '2022-02-04T19:19:04.044Z',
    '2022-02-04T19:19:04.044Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '38A27EBF-21FA-4880-A2CB-B6ABB875A84E',
    'um umferð í Reykjavík.',
    '2022-02-24T16:23:54.439Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('49453da4-e878-4ef6-8301-20a6095429d0','A384F229-7136-4C5D-8810-909666D14FD7');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('49453da4-e878-4ef6-8301-20a6095429d0','0183E697-4A25-416E-8365-FBD43C75CC52');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('49453da4-e878-4ef6-8301-20a6095429d0','FBA64051-1A6C-4C88-8AAB-929465C1D26C');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '098ca9a7-1acc-436c-bab1-3b0375ee7b07',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202401031',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'E1CCDC95-2547-4623-9AFE-7E9F1FDC0C27',
    '2024-01-31T17:17:47.053Z',
    '2024-01-31T17:17:47.053Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '3985D8F3-FF31-4FA8-B227-7646C904CA1C',
    'um breytingar á ýmsum lögum vegna flutnings á þjóðskrá og almannaskráningu frá Hagstofu Íslands til dómsmálaráðuneytis.',
    '2024-02-25T06:50:00.873Z',
    NULL
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    'b28f92a8-e39f-4c09-882f-fd5ea85a664c',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202307007',
    'cd1536de-4481-492f-8db1-1ea0e3e38880',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '59DCE39C-E6A2-4130-870E-B885EB7FA3E0',
    '2023-07-07T08:38:03.691Z',
    '2023-07-07T08:38:03.691Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'fyrir Námssjóð Sameinaðra verktaka hf. við Háskólann í Reykjavík.',
    '2023-07-28T19:57:58.162Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b28f92a8-e39f-4c09-882f-fd5ea85a664c','3F0EA22D-2B1D-493C-AC2A-02BFD15A3EBC');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b28f92a8-e39f-4c09-882f-fd5ea85a664c','24987958-2F36-449A-A597-7CDC06E817BC');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b28f92a8-e39f-4c09-882f-fd5ea85a664c','DF68E43F-706A-4065-859F-204882C16B67');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b28f92a8-e39f-4c09-882f-fd5ea85a664c','E2DBA929-C915-4858-A12D-9B94C68F57B2');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b28f92a8-e39f-4c09-882f-fd5ea85a664c','E63C0979-42C1-42DB-B488-FB927930143B');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '32266a86-236e-412d-8b24-758829689270',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202306026',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'F5FE2286-6037-47D9-A3DB-6EC73E0345AC',
    '2023-06-26T03:29:16.987Z',
    '2023-06-26T03:29:16.987Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '45C8403B-9B91-424A-9E55-6BA1F6295C3A',
    'um frestun á fundum Alþingis.',
    '2023-07-21T22:45:18.134Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('32266a86-236e-412d-8b24-758829689270','F9A224A1-0B0F-4D52-9028-1D1AADBDCC61');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('32266a86-236e-412d-8b24-758829689270','3DE16D3B-D7D4-46B6-9C0A-DEDDCABBB578');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('32266a86-236e-412d-8b24-758829689270','6BB32AB7-BF98-479C-96D2-4FC2A91DC286');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '2b44ca64-a883-44a7-95d1-893e84389bd1',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202305014',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '591F8370-DF1B-47B9-8F55-12187BD3A466',
    '2023-05-14T04:45:14.553Z',
    '2023-05-14T04:45:14.553Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'fyrir Vísindasjóð samtaka psoriasis- og exemsjúklinga (VSPOEX).',
    '2023-06-04T00:57:05.908Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2b44ca64-a883-44a7-95d1-893e84389bd1','0C0E8F73-3DAC-4CD6-8B2A-E7EFBF75C84A');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2b44ca64-a883-44a7-95d1-893e84389bd1','4E12BC6F-9A2D-4589-9BFA-8A774F4C89DA');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2b44ca64-a883-44a7-95d1-893e84389bd1','28C2854B-16EB-407E-9F8E-80238765BA89');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2b44ca64-a883-44a7-95d1-893e84389bd1','5E046AF6-E728-4897-8B20-BD4A7C05FF14');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    'd2eeeb08-3393-461d-ab55-68562b4f2202',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202307029',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '3305E90C-2851-440C-B070-EF1FBE792D13',
    '2023-07-29T02:00:20.153Z',
    '2023-07-29T02:00:20.153Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '3083494A-1BC4-4B45-9436-70D601E32A5F',
    'um breyting á lögum nr. 90/2003, um tekjuskatt, með síðari breytingum.',
    '2023-08-10T00:27:16.961Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('d2eeeb08-3393-461d-ab55-68562b4f2202','752EADD5-1523-4983-A926-11AB62A83024');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('d2eeeb08-3393-461d-ab55-68562b4f2202','ED300CCA-5E85-4209-AB42-96721E0AC9C8');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('d2eeeb08-3393-461d-ab55-68562b4f2202','88E9ECF7-9CFD-4B6C-93DE-598889E39E5F');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('d2eeeb08-3393-461d-ab55-68562b4f2202','33012176-B7EC-498D-912E-7B5BBB085A22');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('d2eeeb08-3393-461d-ab55-68562b4f2202','6CF7EADD-5CB2-425E-9777-517382B3E0E4');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '5c4cd26c-90ae-4d84-9d0e-b91883381c45',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202203024',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '30AB3E49-EF19-4043-BE53-76D3615DE64D',
    '2022-03-24T14:09:33.913Z',
    '2022-03-24T14:09:33.913Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    'D648891A-E4EA-42A5-9E71-47DD521225B7',
    'um Flugmálastjórn Íslands.',
    '2022-03-26T04:37:44.944Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('5c4cd26c-90ae-4d84-9d0e-b91883381c45','D8C291C3-26D0-4321-9DAE-957582325587');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('5c4cd26c-90ae-4d84-9d0e-b91883381c45','E3816C33-2724-44E8-9408-3C5BF0D49338');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('5c4cd26c-90ae-4d84-9d0e-b91883381c45','33FF9B2E-D4BD-4F3A-A026-7E29EFB1E775');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('5c4cd26c-90ae-4d84-9d0e-b91883381c45','801F30CE-6ED3-43DA-91BF-C3C99675119D');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('5c4cd26c-90ae-4d84-9d0e-b91883381c45','CCE02FFA-346E-4237-BAFC-4FBBE53E078C');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    'd0b11b73-f90c-491d-b894-698c7c845d4c',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202308007',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '5FB0F320-FC65-4C76-8327-14CB9149754C',
    '2023-08-07T22:51:41.041Z',
    '2023-08-07T22:51:41.041Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '3A9A64DD-816D-4A27-A694-F568C403C20D',
    'um breytingu á reglugerð nr. 201, 16. mars 2006, um veiðar úr úthafskarfastofninum 2006.',
    '2023-09-03T01:22:35.417Z',
    NULL
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '513fb4a5-8f5f-4360-ae35-37668c400c0f',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202301030',
    '799722be-5530-439a-91dc-606e129b030d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'E214AF81-86CF-4772-92CA-1EEDC8DA344D',
    '2023-01-30T19:00:22.326Z',
    '2023-01-30T19:00:22.326Z',
    false,
    NULL,
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um innköllun þriggja seðlastærða.',
    '2023-02-02T22:16:21.097Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('513fb4a5-8f5f-4360-ae35-37668c400c0f','A2B93601-AC71-47EC-9648-F135592D4172');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('513fb4a5-8f5f-4360-ae35-37668c400c0f','BB8C838C-D865-4269-B6A7-256E9DC9D477');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('513fb4a5-8f5f-4360-ae35-37668c400c0f','4693D5F8-ACA9-470E-94B4-126807FB683B');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('513fb4a5-8f5f-4360-ae35-37668c400c0f','3772EE90-221D-449A-B453-F510FF2D28A9');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    'e7a1f9d6-c210-4960-aff1-952130029ee6',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202304012',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '480853f2-a511-41b5-b663-df655741e77a',
    '3B1EEAA3-7707-41FD-A29A-2DCEB8BADA22',
    '2023-04-12T02:51:33.010Z',
    '2023-04-12T02:51:33.010Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '505C6D03-B86D-4D2D-8112-274DB96E6664',
    'um skipulagsmál í Sveitarfélaginu Árborg.',
    '2023-04-12T18:12:41.552Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('e7a1f9d6-c210-4960-aff1-952130029ee6','6E06868D-8244-4DB6-B3C5-DB4396F221B3');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('e7a1f9d6-c210-4960-aff1-952130029ee6','4EC5280F-3DB2-4E4C-BF6A-7C32079C7199');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('e7a1f9d6-c210-4960-aff1-952130029ee6','87CCEE04-3530-4284-AA50-D34160ABD378');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '08320d16-983c-4bcd-a15e-02ffde3e1940',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202311022',
    '799722be-5530-439a-91dc-606e129b030d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'B092EF99-13A2-453B-A144-0A0BAAFD1F73',
    '2023-11-22T05:59:22.803Z',
    '2023-11-22T05:59:22.803Z',
    true,
    NULL,
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um deiliskipulag í Borgarfjarðarsveit.',
    '2023-12-01T17:14:26.200Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('08320d16-983c-4bcd-a15e-02ffde3e1940','F66E87C1-BCB5-491F-8820-C8D2972B0149');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('08320d16-983c-4bcd-a15e-02ffde3e1940','5B632BD5-5941-4BA4-9204-E3B9DD35EDBE');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('08320d16-983c-4bcd-a15e-02ffde3e1940','FDE24D86-42FF-4357-B060-84FDD0BB9D65');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('08320d16-983c-4bcd-a15e-02ffde3e1940','7C7461CE-EF19-4CCD-8942-277CECBAEBD3');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '3b6ca9a6-1e6f-4082-882a-3255a1a46bec',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202309030',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '6EB51E9D-CE0E-4E05-A000-0797E3D90938',
    '2023-09-30T06:38:37.448Z',
    '2023-09-30T06:38:37.448Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um breytingu á aðalnámskrá framhaldsskóla, brautarlýsingum.',
    '2023-10-23T11:29:31.858Z',
    NULL
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    'efe191f4-2eeb-440d-bfe9-74956f9d4b02',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202311014',
    '799722be-5530-439a-91dc-606e129b030d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '3E8AC32C-8300-44E5-B316-ACE7F08E6E6C',
    '2023-11-14T21:29:06.559Z',
    '2023-11-14T21:29:06.559Z',
    false,
    NULL,
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '55EC9DA9-F2C6-4C36-8F69-84E794B530CD',
    'um deiliskipulag á Blönduósi.',
    '2023-11-24T03:31:41.629Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('efe191f4-2eeb-440d-bfe9-74956f9d4b02','C0B16FE9-7119-43C8-9CBD-0CBDB379E9F5');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('efe191f4-2eeb-440d-bfe9-74956f9d4b02','DB5000D0-50A3-47A0-AD24-AE75CF1268A4');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('efe191f4-2eeb-440d-bfe9-74956f9d4b02','D16CE5A6-6B59-4A2A-90F5-0D41B7427CEF');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('efe191f4-2eeb-440d-bfe9-74956f9d4b02','8F0AB58A-021D-4E29-906D-ED890EFA8B8B');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    'fc63abe9-0f44-4e28-92e9-c8914696a426',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202312011',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '480853f2-a511-41b5-b663-df655741e77a',
    'C678EE7D-1985-4516-AC69-7C21C7D8D773',
    '2023-12-11T12:34:07.183Z',
    '2023-12-11T12:34:07.183Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '28B320E4-52B9-4DE9-AB4A-CB8738DE613A',
    'um staðfestingu á aðalskipulagi Sveitarfélagsins Álftaness 2005-2024.',
    '2024-01-05T15:14:34.292Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('fc63abe9-0f44-4e28-92e9-c8914696a426','B520F4AB-E7EA-4711-9B17-CEB848EB1CF5');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    'c8d0b1ac-bd2a-4132-be66-5da3f528c0d1',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202407022',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '480853f2-a511-41b5-b663-df655741e77a',
    '56D637FF-1B04-4353-BE6E-825B62D186DB',
    '2024-07-22T02:22:13.495Z',
    '2024-07-22T02:22:13.495Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '7a6a59ac-45ed-401f-b2a3-8480fd4b6438',
    'um (5.) breytingu á reglugerð nr. 873/2005 um úthlutun á tollkvótum vegna innflutnings á grænmeti.',
    '2024-08-03T01:05:36.783Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c8d0b1ac-bd2a-4132-be66-5da3f528c0d1','7093C35F-DEBF-4B7C-9C87-FCB3BD681311');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c8d0b1ac-bd2a-4132-be66-5da3f528c0d1','22572CF2-716D-4861-933E-F72B00FB42CB');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '0dbb859c-d61b-415b-b6ef-826617d556d6',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202303025',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '3EF65043-163D-4A56-9543-7DEE7EC442DD',
    '2023-03-25T15:03:20.497Z',
    '2023-03-25T15:03:20.497Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um stjórn og fundarsköp Þingeyjarsveitar.',
    '2023-03-29T00:09:23.987Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0dbb859c-d61b-415b-b6ef-826617d556d6','4D92FC9E-8D93-4D66-8C14-DC2F03AED0FC');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0dbb859c-d61b-415b-b6ef-826617d556d6','1ABBC0C1-FACA-4BA7-972F-8BC307507946');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0dbb859c-d61b-415b-b6ef-826617d556d6','E824D8BC-5B12-445B-B15E-7AD583869172');
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
  VALUES (
    '9d245184-99f1-4972-8c55-5dd8d3336743',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202404007',
    'cd1536de-4481-492f-8db1-1ea0e3e38880',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '2ACB0E3A-B7D2-42D5-B442-D6028036202D',
    '2024-04-07T07:51:06.965Z',
    '2024-04-07T07:51:06.965Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '371A2E7A-6ED8-4A09-9B5F-330E499FCD81',
    'um öryggisblöð.',
    '2024-05-02T14:37:20.516Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9d245184-99f1-4972-8c55-5dd8d3336743','DA8E92F7-5B4B-4D2E-A6C2-ADAACB9893A1');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9d245184-99f1-4972-8c55-5dd8d3336743','C45B5E00-C897-42C0-B44B-95D4D348E53A');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9d245184-99f1-4972-8c55-5dd8d3336743','63B09DA5-E546-49C5-8B5F-4A64D39F94E6');
