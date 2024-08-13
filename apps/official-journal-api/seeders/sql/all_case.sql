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
    'ed61adfc-37f0-4e72-815a-295e2c80e5f2',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202310026',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'FB2656EB-F101-4059-BB02-8252C883FF55',
    '2023-10-26T10:42:55.904Z',
    '2023-10-26T10:42:55.904Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um veiðar úr úthafskarfastofnum 2006.',
    '2023-11-09T05:35:09.997Z',
    NULL
  );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a38d1f20-9b5f-4713-aef6-b182be811ffe',
            'Yngvi Ögmundarson',
            NULL,
            'Fjármála- og efnahagsráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '3386c1f3-1438-40af-9a14-44e0111ba86c',
            'Ásta Oddný Stefánsdóttir',
            NULL,
            'Sendiherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'b18e0303-b301-4d6c-96a2-1cd1d7fb29f6',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-10-26T10:42:55.904Z',
      'Listasafn Íslands',
      'FB2656EB-F101-4059-BB02-8252C883FF55',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b18e0303-b301-4d6c-96a2-1cd1d7fb29f6',
        'a38d1f20-9b5f-4713-aef6-b182be811ffe'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b18e0303-b301-4d6c-96a2-1cd1d7fb29f6',
        '3386c1f3-1438-40af-9a14-44e0111ba86c'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'ed61adfc-37f0-4e72-815a-295e2c80e5f2',
      'b18e0303-b301-4d6c-96a2-1cd1d7fb29f6'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'cf983c44-659b-445b-b263-1b64ca5363d0',
            'Valdimar Finnsson',
            NULL,
            'Forsætisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '20e9eb8f-1b88-49a9-8a02-cf89002e2369',
            'Finnur Ólafur Davíðsson',
            NULL,
            'Mennta- og barnamálaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'cb35dd29-7cb3-4ff2-9d47-dc28b36e15d6',
            'Helga Karlsdóttir',
            NULL,
            NULL,
            'Utanríkisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '28755b25-94db-4b76-8ced-82b5cf0a7d4c',
            'Dagmar Jóhanna Njálsdóttir',
            NULL,
            NULL,
            'Innviðaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'fdded1be-66bd-4e23-804a-d250e4206738',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-10-26T10:42:55.904Z',
      'Heilbrigðisstofnun Vesturlands',
      'FB2656EB-F101-4059-BB02-8252C883FF55',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'fdded1be-66bd-4e23-804a-d250e4206738',
        'cf983c44-659b-445b-b263-1b64ca5363d0'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'fdded1be-66bd-4e23-804a-d250e4206738',
        '20e9eb8f-1b88-49a9-8a02-cf89002e2369'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'fdded1be-66bd-4e23-804a-d250e4206738',
        'cb35dd29-7cb3-4ff2-9d47-dc28b36e15d6'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'fdded1be-66bd-4e23-804a-d250e4206738',
        '28755b25-94db-4b76-8ced-82b5cf0a7d4c'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'ed61adfc-37f0-4e72-815a-295e2c80e5f2',
      'fdded1be-66bd-4e23-804a-d250e4206738'
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
    '68a9a0d8-df78-4e6a-8eea-9f6f1906a712',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202203015',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '34110436-6CC5-486F-9A29-0829D8E093AD',
    '2022-03-15T11:11:36.569Z',
    '2022-03-15T11:11:36.569Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um veitingu leyfa til fornleifarannsókna.',
    '2022-04-12T19:57:37.856Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('68a9a0d8-df78-4e6a-8eea-9f6f1906a712','03A0F8AE-AAFF-4D20-A756-FC81F5013380');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '62550a6e-9fd5-46d6-84c9-cd3922898dba',
            'Ögmundur Yngvason',
            NULL,
            NULL,
            'Menningar- og viðskiptaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '743786e3-f8eb-42b7-863f-0d142ff558c8',
            'Magnús Finnsson',
            NULL,
            'Aðstoðarframkvæmdarstjóri',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '1b86a77b-368a-4967-b444-930ba7f21449',
            'Perla Sigríður Andradóttir',
            NULL,
            NULL,
            'Aðstoðarframkvæmdarstjóri'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'c196a0e5-d65a-41f6-b430-cce0d00081f4',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2022-03-15T11:11:36.569Z',
      'Landspítali',
      '34110436-6CC5-486F-9A29-0829D8E093AD',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'c196a0e5-d65a-41f6-b430-cce0d00081f4',
        '62550a6e-9fd5-46d6-84c9-cd3922898dba'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'c196a0e5-d65a-41f6-b430-cce0d00081f4',
        '743786e3-f8eb-42b7-863f-0d142ff558c8'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'c196a0e5-d65a-41f6-b430-cce0d00081f4',
        '1b86a77b-368a-4967-b444-930ba7f21449'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '68a9a0d8-df78-4e6a-8eea-9f6f1906a712',
      'c196a0e5-d65a-41f6-b430-cce0d00081f4'
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
    '3dcd9dbc-0cd8-4bb5-a250-864cef4e9c26',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202205009',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '0F9A900F-D67D-4615-AC15-4F92114A56D5',
    '2022-05-09T14:32:48.939Z',
    '2022-05-09T14:32:48.939Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '3EEA4E74-FDE6-431E-A988-FF8F226544A6',
    'um svæðisskipulag Austur-Húnavatnssýslu 2004-2016.',
    '2022-05-18T12:44:15.170Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('3dcd9dbc-0cd8-4bb5-a250-864cef4e9c26','7EF21C4D-86B2-4AF6-B70F-461DEA5385C1');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('3dcd9dbc-0cd8-4bb5-a250-864cef4e9c26','1B32DB61-A604-4A27-B4D7-1AB98B29E3BC');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '4d1df895-3dd2-45ab-9b0e-a316fdf9f260',
            'Guðrún Oddný Gunnarsdóttir',
            NULL,
            NULL,
            'Utanríkisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '525fde70-8d7c-4076-86e0-6d44c4e4af16',
            'Úlfhildur Ýmirsdóttir',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8691352d-d897-49eb-8aee-291498d43a4d',
            'Ingimar Unnarsson',
            NULL,
            'Fjármála- og efnahagsráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '2c6966c8-0dee-4e86-9e03-603bdfd58de9',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2022-05-09T14:32:48.939Z',
      'Lögreglustjórinn á höfuðborgarsvæðinu',
      '0F9A900F-D67D-4615-AC15-4F92114A56D5',
      '4d1df895-3dd2-45ab-9b0e-a316fdf9f260',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2c6966c8-0dee-4e86-9e03-603bdfd58de9',
        '4d1df895-3dd2-45ab-9b0e-a316fdf9f260'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2c6966c8-0dee-4e86-9e03-603bdfd58de9',
        '525fde70-8d7c-4076-86e0-6d44c4e4af16'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2c6966c8-0dee-4e86-9e03-603bdfd58de9',
        '8691352d-d897-49eb-8aee-291498d43a4d'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '3dcd9dbc-0cd8-4bb5-a250-864cef4e9c26',
      '2c6966c8-0dee-4e86-9e03-603bdfd58de9'
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
    '59e7c927-e329-4467-8856-0215ba0d3028',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202311025',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '480853f2-a511-41b5-b663-df655741e77a',
    'ECD0328D-6B7E-49AA-B7C2-B6614B255649',
    '2023-11-25T05:18:43.039Z',
    '2023-11-25T05:18:43.039Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '55EC9DA9-F2C6-4C36-8F69-84E794B530CD',
    'um breytingu á aðalskipulagi Mosfellsbæjar 2002-2024, iðnaðarsvæði við Flugumýri.',
    '2023-12-11T19:25:34.272Z',
    NULL
  );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'dacd3685-d71a-44ea-a599-2c529196255b',
            'Fanney Kristín Tómasdóttir',
            NULL,
            NULL,
            'Framkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8fc63d14-8f03-4f8c-b3c3-746f7abf1964',
            'Unnar Karl Stefánsson',
            NULL,
            'Utanríkisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7b1b02a2-73cd-4a02-ac8d-ec8300ef1dc7',
            'Nína Guðrún Karlsdóttir',
            NULL,
            'Fjármála- og efnahagsráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '611ffe47-c70a-4528-91f9-899b507533c6',
            'Sigríður Ösp Karlsdóttir',
            NULL,
            NULL,
            'Stjórnarmenn'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e8503ef1-5e4b-4d60-9d3b-3d5b242c97de',
            'Ösp Jónsdóttir',
            NULL,
            'Matvælaráðherra ',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'cdb397c7-0f99-4725-b40a-dafcfa95763e',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-11-25T05:18:43.039Z',
      'Náttúruminjasafn Íslands',
      'ECD0328D-6B7E-49AA-B7C2-B6614B255649',
      'dacd3685-d71a-44ea-a599-2c529196255b',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'cdb397c7-0f99-4725-b40a-dafcfa95763e',
        'dacd3685-d71a-44ea-a599-2c529196255b'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'cdb397c7-0f99-4725-b40a-dafcfa95763e',
        '8fc63d14-8f03-4f8c-b3c3-746f7abf1964'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'cdb397c7-0f99-4725-b40a-dafcfa95763e',
        '7b1b02a2-73cd-4a02-ac8d-ec8300ef1dc7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'cdb397c7-0f99-4725-b40a-dafcfa95763e',
        '611ffe47-c70a-4528-91f9-899b507533c6'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'cdb397c7-0f99-4725-b40a-dafcfa95763e',
        'e8503ef1-5e4b-4d60-9d3b-3d5b242c97de'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '59e7c927-e329-4467-8856-0215ba0d3028',
      'cdb397c7-0f99-4725-b40a-dafcfa95763e'
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
    '83462465-0e1b-4060-845f-990f31b9ec19',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202303018',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '52EBA54E-DE71-4E01-BA8E-FCAA48BB5688',
    '2023-03-18T19:23:26.824Z',
    '2023-03-18T19:23:26.824Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '96E93299-F53E-49AF-A0DC-E43A2BD76488',
    'um deiliskipulag í Borgarfjarðarsveit.',
    '2023-03-20T23:03:00.508Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('83462465-0e1b-4060-845f-990f31b9ec19','07D11167-0B73-4AA1-9858-424E5649D746');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('83462465-0e1b-4060-845f-990f31b9ec19','90953072-4955-4584-BC77-2EE9F4609FA4');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '1ad9069d-7b82-436f-abc4-d9936e126f14',
            'Oddur Unnarsson',
            NULL,
            NULL,
            'Umhverfis-, orku og loftslagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '1aa0d0d9-7210-43ec-a131-9b84b920c4b7',
            'Ásta Þórdís Finnsdóttir',
            NULL,
            NULL,
            'Aðstoðarframkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'ad81ccdf-cb1b-4c24-b4e7-b2324adb5a4a',
            'Kristín Pétursdóttir',
            NULL,
            'Utanríkisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'ea580219-d6bf-4375-ba7b-30206b6791d7',
            'Yngvi Valdimarsson',
            NULL,
            'Aðstoðarframkvæmdarstjóri',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '5e469801-d496-42a2-910a-43c5f171990b',
            'Jón Karlsson',
            NULL,
            NULL,
            'Menningar- og viðskiptaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '0e73862f-3562-4648-a4f9-b829ee1dc4d7',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-03-18T19:23:26.824Z',
      'Listasafn Einars Jónssonar',
      '52EBA54E-DE71-4E01-BA8E-FCAA48BB5688',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '0e73862f-3562-4648-a4f9-b829ee1dc4d7',
        '1ad9069d-7b82-436f-abc4-d9936e126f14'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '0e73862f-3562-4648-a4f9-b829ee1dc4d7',
        '1aa0d0d9-7210-43ec-a131-9b84b920c4b7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '0e73862f-3562-4648-a4f9-b829ee1dc4d7',
        'ad81ccdf-cb1b-4c24-b4e7-b2324adb5a4a'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '0e73862f-3562-4648-a4f9-b829ee1dc4d7',
        'ea580219-d6bf-4375-ba7b-30206b6791d7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '0e73862f-3562-4648-a4f9-b829ee1dc4d7',
        '5e469801-d496-42a2-910a-43c5f171990b'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '83462465-0e1b-4060-845f-990f31b9ec19',
      '0e73862f-3562-4648-a4f9-b829ee1dc4d7'
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
    'e0b10949-cf1c-44ac-982b-a46067ba3041',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202406025',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'A77FA21F-3EDA-4D8C-8209-9104500FCB15',
    '2024-06-25T05:26:55.728Z',
    '2024-06-25T05:26:55.728Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um stjórn Dalvíkurbyggðar og fundarsköp bæjarstjórnar.',
    '2024-07-13T03:57:33.546Z',
    NULL
  );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '2a1415ae-ceb5-418b-b7e3-8beabe00fbc9',
            'Tómas Þorsteinsson',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a65f47c1-a49b-4a98-bdad-c5a546581667',
            'Yngvi Gunnar Úlfarsson',
            NULL,
            'Umhverfis-, orku og loftslagsráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7dea94d7-5ddd-40d1-9d65-97208df7b84d',
            'Íris Þorsteinsdóttir',
            NULL,
            NULL,
            'Dómari'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'f5b70de1-d541-49e2-a07f-4ef4c81bf1b5',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-06-25T05:26:55.728Z',
      'Sjúkratryggingar Íslands',
      'A77FA21F-3EDA-4D8C-8209-9104500FCB15',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f5b70de1-d541-49e2-a07f-4ef4c81bf1b5',
        '2a1415ae-ceb5-418b-b7e3-8beabe00fbc9'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f5b70de1-d541-49e2-a07f-4ef4c81bf1b5',
        'a65f47c1-a49b-4a98-bdad-c5a546581667'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f5b70de1-d541-49e2-a07f-4ef4c81bf1b5',
        '7dea94d7-5ddd-40d1-9d65-97208df7b84d'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'e0b10949-cf1c-44ac-982b-a46067ba3041',
      'f5b70de1-d541-49e2-a07f-4ef4c81bf1b5'
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
    '34eac627-488d-4524-82f3-cc173825ff20',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202305022',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '487C6D40-ABB8-46F9-849B-2ADF782DA371',
    '2023-05-22T13:01:08.385Z',
    '2023-05-22T13:01:08.385Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '43F8E13D-EA01-4D90-A53A-DCCCA6BD7C48',
    'um breytingu á lögum nr. 8/1996, um löggildingu nokkurra starfsheita sérfræðinga í tækni- og hönnunargreinum, með síðari breytingum.',
    '2023-06-04T04:35:19.651Z',
    NULL
  );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'f656e477-9aa6-4de3-99cb-585dc60311c7',
            'Úlfar Ögmundarson',
            NULL,
            NULL,
            'Innviðaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '338e226c-12f4-42d1-92e4-095f323a03e9',
            'Elín Dagmar Njálsdóttir',
            NULL,
            NULL,
            'Dómsmálaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e3785982-1dc0-4895-a1e8-6e2f0409a8f8',
            'Fanney Ýmirsdóttir',
            NULL,
            NULL,
            'Framkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'df558618-ce84-44f4-bad8-5e1006564d0c',
            'Kristín Björnsdóttir',
            NULL,
            'Matvælaráðherra ',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'e5599cad-0fd1-45e1-a8fe-8dab8c7aa1e9',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-05-22T13:01:08.385Z',
      'Náttúrufræðistofnun Íslands',
      '487C6D40-ABB8-46F9-849B-2ADF782DA371',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e5599cad-0fd1-45e1-a8fe-8dab8c7aa1e9',
        'f656e477-9aa6-4de3-99cb-585dc60311c7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e5599cad-0fd1-45e1-a8fe-8dab8c7aa1e9',
        '338e226c-12f4-42d1-92e4-095f323a03e9'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e5599cad-0fd1-45e1-a8fe-8dab8c7aa1e9',
        'e3785982-1dc0-4895-a1e8-6e2f0409a8f8'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e5599cad-0fd1-45e1-a8fe-8dab8c7aa1e9',
        'df558618-ce84-44f4-bad8-5e1006564d0c'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '34eac627-488d-4524-82f3-cc173825ff20',
      'e5599cad-0fd1-45e1-a8fe-8dab8c7aa1e9'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '81cad9d6-20e1-45b4-9cd2-3d81d2faeda1',
            'Ögmundur Davíðsson',
            NULL,
            NULL,
            'Fjármála- og efnahagsráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'a6bcee60-212f-4857-82bd-14ae1809ad0e',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-05-22T13:01:08.385Z',
      'Ferðamálastofa',
      '487C6D40-ABB8-46F9-849B-2ADF782DA371',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a6bcee60-212f-4857-82bd-14ae1809ad0e',
        '81cad9d6-20e1-45b4-9cd2-3d81d2faeda1'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '34eac627-488d-4524-82f3-cc173825ff20',
      'a6bcee60-212f-4857-82bd-14ae1809ad0e'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'dfc625f8-a5ee-40cc-9cad-3e1003a24a91',
            'Ýr Úlfhildur Hjaltadóttir',
            NULL,
            NULL,
            'Mennta- og barnamálaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '46c4bfd0-5863-40a2-bf83-c2092925b7ea',
            'Valgerður Anna Stefánsdóttir',
            NULL,
            NULL,
            'Heilbrigðisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '5ae2f034-0c61-4e90-92e9-801028b223cf',
            'Ólöf Kristín Yngvadóttir',
            NULL,
            'Forsætisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e0ac599f-e8f9-4ba3-a48f-bf8ffe96ddf1',
            'Magnús Pétur Jónsson',
            NULL,
            NULL,
            'Sendiherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '0ebcae4c-aee8-4388-94d5-7d36452d6295',
            'Úlfar Karl Magnússon',
            NULL,
            'Stjórnarmenn',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'e22c912a-095f-4658-9a9b-ea9103561905',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-05-22T13:01:08.385Z',
      'Vinnueftirlit ríkisins',
      '487C6D40-ABB8-46F9-849B-2ADF782DA371',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e22c912a-095f-4658-9a9b-ea9103561905',
        'dfc625f8-a5ee-40cc-9cad-3e1003a24a91'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e22c912a-095f-4658-9a9b-ea9103561905',
        '46c4bfd0-5863-40a2-bf83-c2092925b7ea'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e22c912a-095f-4658-9a9b-ea9103561905',
        '5ae2f034-0c61-4e90-92e9-801028b223cf'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e22c912a-095f-4658-9a9b-ea9103561905',
        'e0ac599f-e8f9-4ba3-a48f-bf8ffe96ddf1'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e22c912a-095f-4658-9a9b-ea9103561905',
        '0ebcae4c-aee8-4388-94d5-7d36452d6295'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '34eac627-488d-4524-82f3-cc173825ff20',
      'e22c912a-095f-4658-9a9b-ea9103561905'
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
    '8ae7bf91-df71-4c88-8520-50cd7ebfeee1',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202407018',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'DCBA20D9-6B97-40FF-8C99-FCACBA5BB1DB',
    '2024-07-18T10:13:10.101Z',
    '2024-07-18T10:13:10.101Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '38A27EBF-21FA-4880-A2CB-B6ABB875A84E',
    'um deiliskipulag í Borgarfjarðarsveit.',
    '2024-07-20T21:31:08.602Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('8ae7bf91-df71-4c88-8520-50cd7ebfeee1','5BA182DF-0D34-4DD3-99CD-9F98783371A7');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('8ae7bf91-df71-4c88-8520-50cd7ebfeee1','EFCF7D74-D773-45E5-8FDB-9C41EDFCD32D');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('8ae7bf91-df71-4c88-8520-50cd7ebfeee1','0DE58450-A6FB-4691-AAEC-36D69ABD1BD0');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('8ae7bf91-df71-4c88-8520-50cd7ebfeee1','07D11167-0B73-4AA1-9858-424E5649D746');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('8ae7bf91-df71-4c88-8520-50cd7ebfeee1','4B1A9D96-2ED3-460B-8962-386517DA38C5');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '90e98407-15bf-43bd-bf2c-419d2d36d164',
            'Finnur Úlfar Tómasson',
            NULL,
            NULL,
            'Bankaráðsmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a91b1a27-20ea-4938-af1a-3e05c3e959d8',
            'Stefán Úlfarsson',
            NULL,
            NULL,
            'Menningar- og viðskiptaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '32ff155f-e79b-4674-af9e-253644ef6fb6',
            'Valdimar Ragnar Lárusson',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'b36445d1-64fe-44ef-af57-d7a6c55b9ee2',
            'Ólöf Lárusdóttir',
            NULL,
            NULL,
            'Innviðaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'fbbc1aeb-24ee-498b-a2b0-9b63d1de1133',
            'Gunnar Lárusson',
            NULL,
            'Háskóla-, iðnaða- og nýsköpunarráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'a009863a-6691-4a65-9c18-15f7eee583b3',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2024-07-18T10:13:10.101Z',
      'Hafrannsóknastofnun - Rannsókna- og ráðgjafarstofnun hafs og vatna',
      'DCBA20D9-6B97-40FF-8C99-FCACBA5BB1DB',
      '90e98407-15bf-43bd-bf2c-419d2d36d164',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a009863a-6691-4a65-9c18-15f7eee583b3',
        '90e98407-15bf-43bd-bf2c-419d2d36d164'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a009863a-6691-4a65-9c18-15f7eee583b3',
        'a91b1a27-20ea-4938-af1a-3e05c3e959d8'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a009863a-6691-4a65-9c18-15f7eee583b3',
        '32ff155f-e79b-4674-af9e-253644ef6fb6'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a009863a-6691-4a65-9c18-15f7eee583b3',
        'b36445d1-64fe-44ef-af57-d7a6c55b9ee2'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a009863a-6691-4a65-9c18-15f7eee583b3',
        'fbbc1aeb-24ee-498b-a2b0-9b63d1de1133'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '8ae7bf91-df71-4c88-8520-50cd7ebfeee1',
      'a009863a-6691-4a65-9c18-15f7eee583b3'
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
    '7b04a39b-679c-49fa-a2ee-4f8cfb46b593',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202406004',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '480853f2-a511-41b5-b663-df655741e77a',
    'AE0CDA19-8832-4F11-A2B7-6F5966A54C4D',
    '2024-06-04T10:53:58.463Z',
    '2024-06-04T10:53:58.463Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '2C39CC10-85E1-436E-9083-40E3C4ED49BE',
    'um breytingu á svæðisskipulagi Mýrasýslu 1998-2010, Hvítársíðuhreppur.',
    '2024-06-16T04:19:48.929Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('7b04a39b-679c-49fa-a2ee-4f8cfb46b593','15A9CF07-71E5-445B-A2E4-1250F9FE870D');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'c7b11c1b-f2bf-4ef0-bc77-37fa319b5e25',
            'Perla Björnsdóttir',
            NULL,
            'Mennta- og barnamálaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'f7d571b6-3242-4b16-b2b5-df1aaf0fc1f7',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2024-06-04T10:53:58.463Z',
      'Lögreglustjórinn í Vestmannaeyjum',
      'AE0CDA19-8832-4F11-A2B7-6F5966A54C4D',
      'c7b11c1b-f2bf-4ef0-bc77-37fa319b5e25',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f7d571b6-3242-4b16-b2b5-df1aaf0fc1f7',
        'c7b11c1b-f2bf-4ef0-bc77-37fa319b5e25'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '7b04a39b-679c-49fa-a2ee-4f8cfb46b593',
      'f7d571b6-3242-4b16-b2b5-df1aaf0fc1f7'
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
    '62b2e59f-dd0e-4d9a-941d-d59779dfed44',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202301011',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'AFFC4EB6-3830-4EF1-AAC6-42A6D3F9FED7',
    '2023-01-11T00:39:38.660Z',
    '2023-01-11T00:39:38.660Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '4C70F587-7715-4087-AE40-8A5626A70BA6',
    'um breytingu á lögreglusamþykkt fyrir Sveitarfélagið Hornafjörð, nr. 129 22. febrúar 2000.',
    '2023-02-08T16:52:07.293Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('62b2e59f-dd0e-4d9a-941d-d59779dfed44','CCE02FFA-346E-4237-BAFC-4FBBE53E078C');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('62b2e59f-dd0e-4d9a-941d-d59779dfed44','9EECAA46-1752-40E9-919D-855750676FA4');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'ff3e8cac-a359-47bc-b6f6-aae929f341bb',
            'Valdimar Yngvason',
            NULL,
            'Innviðaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '5f2b9f9e-beeb-4add-b494-e8e77f396225',
            'Ólafur Hjaltason',
            NULL,
            NULL,
            'Fjármála- og efnahagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'bc2d144f-deb6-44b9-a382-4068d69b992a',
            'Ýmir Ýmirsson',
            NULL,
            'Dómsmálaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'dd20ec4a-630e-4779-9f21-a63057163fa7',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-01-11T00:39:38.660Z',
      'Neytendastofa',
      'AFFC4EB6-3830-4EF1-AAC6-42A6D3F9FED7',
      'ff3e8cac-a359-47bc-b6f6-aae929f341bb',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'dd20ec4a-630e-4779-9f21-a63057163fa7',
        'ff3e8cac-a359-47bc-b6f6-aae929f341bb'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'dd20ec4a-630e-4779-9f21-a63057163fa7',
        '5f2b9f9e-beeb-4add-b494-e8e77f396225'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'dd20ec4a-630e-4779-9f21-a63057163fa7',
        'bc2d144f-deb6-44b9-a382-4068d69b992a'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '62b2e59f-dd0e-4d9a-941d-d59779dfed44',
      'dd20ec4a-630e-4779-9f21-a63057163fa7'
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
    '4efe06ff-8904-4c26-8743-51ceef9f5824',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202406012',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '0F9A900F-D67D-4615-AC15-4F92114A56D5',
    '2024-06-12T21:57:59.633Z',
    '2024-06-12T21:57:59.633Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '78F512F5-6FEE-4E00-B029-EF9002836C1C',
    'um breytingu á aðalskipulagi Mosfellsbæjar 2002-2024, iðnaðarsvæði við Leirvogstungu.',
    '2024-06-24T12:53:21.771Z',
    NULL
  );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'cfda4db2-2553-42be-94db-d845e38af821',
            'Ólöf Karlsdóttir',
            NULL,
            'Sendiherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '2c943f6c-795a-4499-bf57-2d3ad2ad8b36',
            'Valdimar Davíðsson',
            NULL,
            NULL,
            'Umhverfis-, orku og loftslagsráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '993fe6db-9b4a-4a5b-a3a4-c21aa4a9190a',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-06-12T21:57:59.633Z',
      'Hagstofa Íslands',
      '0F9A900F-D67D-4615-AC15-4F92114A56D5',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '993fe6db-9b4a-4a5b-a3a4-c21aa4a9190a',
        'cfda4db2-2553-42be-94db-d845e38af821'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '993fe6db-9b4a-4a5b-a3a4-c21aa4a9190a',
        '2c943f6c-795a-4499-bf57-2d3ad2ad8b36'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '4efe06ff-8904-4c26-8743-51ceef9f5824',
      '993fe6db-9b4a-4a5b-a3a4-c21aa4a9190a'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'd4bf4979-3c74-4439-8f9d-7386e890a40c',
            'Ragnheiður Fanney Karlsdóttir',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '0a5874d0-5cd0-438a-b5f6-fb133b374c5a',
            'Tanja Fanney Finnsdóttir',
            NULL,
            NULL,
            'Umhverfis-, orku og loftslagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '454173be-839f-4153-aaec-45379cd25767',
            'Oddný Sigríður Njálsdóttir',
            NULL,
            NULL,
            'Háskóla-, iðnaða- og nýsköpunarráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'cbcd3ad1-eeb6-4b99-a09f-58cedbad72d8',
            'Ýr Oddný Pétursdóttir',
            NULL,
            'Fjármála- og efnahagsráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '01e50ab6-0788-4a78-ba16-8870f104559d',
            'Karl Ragnar Úlfarsson',
            NULL,
            NULL,
            'Félags- og vinnumálaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '79657458-7045-4c73-aff0-5fd52da77ce9',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-06-12T21:57:59.633Z',
      'Heilbrigðisstofnun Suðurlands',
      '0F9A900F-D67D-4615-AC15-4F92114A56D5',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '79657458-7045-4c73-aff0-5fd52da77ce9',
        'd4bf4979-3c74-4439-8f9d-7386e890a40c'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '79657458-7045-4c73-aff0-5fd52da77ce9',
        '0a5874d0-5cd0-438a-b5f6-fb133b374c5a'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '79657458-7045-4c73-aff0-5fd52da77ce9',
        '454173be-839f-4153-aaec-45379cd25767'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '79657458-7045-4c73-aff0-5fd52da77ce9',
        'cbcd3ad1-eeb6-4b99-a09f-58cedbad72d8'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '79657458-7045-4c73-aff0-5fd52da77ce9',
        '01e50ab6-0788-4a78-ba16-8870f104559d'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '4efe06ff-8904-4c26-8743-51ceef9f5824',
      '79657458-7045-4c73-aff0-5fd52da77ce9'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e784bc47-51cc-47f1-b50b-adfee3f41b43',
            'Hjalti Magnússon',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'cb91f24e-c05c-46c4-b7c7-9c4aa236fb84',
            'Stefán Ingimarsson',
            NULL,
            NULL,
            'Aðstoðarframkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'fd7960fc-4339-4130-9bc1-977d0684fddc',
            'Lárus Björn Úlfarsson',
            NULL,
            'Mennta- og barnamálaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'bd5bacdd-8067-4dc7-bf6f-2493d33e2c8e',
            'Úlfar Ögmundarson',
            NULL,
            NULL,
            'Stjórnarmenn'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '9ccbeb1e-a31c-4ef0-9344-756ce43916d9',
            'Ýmir Valdimar Valdimarsson',
            NULL,
            NULL,
            'Bankaráðsmaður'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '6b22a0cb-8e7c-4e5f-9c86-0616f1fb50bc',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-06-12T21:57:59.633Z',
      'Vatnajökulsþjóðgarður',
      '0F9A900F-D67D-4615-AC15-4F92114A56D5',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6b22a0cb-8e7c-4e5f-9c86-0616f1fb50bc',
        'e784bc47-51cc-47f1-b50b-adfee3f41b43'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6b22a0cb-8e7c-4e5f-9c86-0616f1fb50bc',
        'cb91f24e-c05c-46c4-b7c7-9c4aa236fb84'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6b22a0cb-8e7c-4e5f-9c86-0616f1fb50bc',
        'fd7960fc-4339-4130-9bc1-977d0684fddc'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6b22a0cb-8e7c-4e5f-9c86-0616f1fb50bc',
        'bd5bacdd-8067-4dc7-bf6f-2493d33e2c8e'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6b22a0cb-8e7c-4e5f-9c86-0616f1fb50bc',
        '9ccbeb1e-a31c-4ef0-9344-756ce43916d9'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '4efe06ff-8904-4c26-8743-51ceef9f5824',
      '6b22a0cb-8e7c-4e5f-9c86-0616f1fb50bc'
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
    '0037839f-ec11-452e-852c-c92e6b4d0485',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202402023',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'A3F0FB27-0CB5-4EC7-8C01-A9BC3A02FF4C',
    '2024-02-23T07:10:49.948Z',
    '2024-02-23T07:10:49.948Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '43F8E13D-EA01-4D90-A53A-DCCCA6BD7C48',
    'um breytingu á aðalskipulagi Reykjavíkur 2001-2024, Hallsvegur.',
    '2024-03-19T00:41:42.449Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0037839f-ec11-452e-852c-c92e6b4d0485','D52FA332-5CD2-4E67-8EEC-99139F9DFB91');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0037839f-ec11-452e-852c-c92e6b4d0485','D16CE5A6-6B59-4A2A-90F5-0D41B7427CEF');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0037839f-ec11-452e-852c-c92e6b4d0485','801F30CE-6ED3-43DA-91BF-C3C99675119D');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '73d8725b-cdf4-4abe-8c9d-3dc91785a277',
            'Íris Margrét Hjaltadóttir',
            NULL,
            NULL,
            'Þingmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '83155c6e-85f9-4eec-9ea2-7e9982dffb7f',
            'Davíð Davíð Karlsson',
            NULL,
            NULL,
            'Stjórnarmenn'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '677a524f-aa50-4ffc-a4c1-984b4b189638',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2024-02-23T07:10:49.948Z',
      'Sýslumaðurinn á Suðurnesjum',
      'A3F0FB27-0CB5-4EC7-8C01-A9BC3A02FF4C',
      '73d8725b-cdf4-4abe-8c9d-3dc91785a277',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '677a524f-aa50-4ffc-a4c1-984b4b189638',
        '73d8725b-cdf4-4abe-8c9d-3dc91785a277'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '677a524f-aa50-4ffc-a4c1-984b4b189638',
        '83155c6e-85f9-4eec-9ea2-7e9982dffb7f'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '0037839f-ec11-452e-852c-c92e6b4d0485',
      '677a524f-aa50-4ffc-a4c1-984b4b189638'
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
    'ddeb80bc-d0d2-41f8-b2fd-65e867ba203b',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202402028',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'C371B8B7-3108-4706-A24A-65695D82D662',
    '2024-02-28T14:04:04.047Z',
    '2024-02-28T14:04:04.047Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '371A2E7A-6ED8-4A09-9B5F-330E499FCD81',
    'um breytingu á reglugerð nr. 849, 14. desember 1999 um eftirlit með innflutningi sjávarafurða.',
    '2024-03-12T05:51:48.028Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('ddeb80bc-d0d2-41f8-b2fd-65e867ba203b','07FAFC03-9393-4257-9D10-B97C59CD1E94');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('ddeb80bc-d0d2-41f8-b2fd-65e867ba203b','E2289056-286D-436C-B3E7-F00FF5D84332');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '0556e177-c667-4e0b-8d98-326498c26a63',
            'Jóhanna Björnsdóttir',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '0e0bae5f-65fd-4f88-9e54-1501bb7e01fe',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-02-28T14:04:04.047Z',
      'Lögreglustjórinn á Suðurnesjum',
      'C371B8B7-3108-4706-A24A-65695D82D662',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '0e0bae5f-65fd-4f88-9e54-1501bb7e01fe',
        '0556e177-c667-4e0b-8d98-326498c26a63'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'ddeb80bc-d0d2-41f8-b2fd-65e867ba203b',
      '0e0bae5f-65fd-4f88-9e54-1501bb7e01fe'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '209abbae-ddf3-4ae9-a767-32ddb9d5ecd0',
            'Tómas Pétursson',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '78f7dd3e-5c6f-4f4a-a9fa-65e290abe94e',
            'Ragnar Björn Ólafsson',
            NULL,
            NULL,
            'Utanríkisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e873b3d4-bbe5-43e7-92b8-04d972f40e1a',
            'Perla Lilja Ólafsdóttir',
            NULL,
            NULL,
            'Aðstoðarframkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '0dc2128c-22f5-4b97-9e64-dee82efcd8e7',
            'Finnur Yngvi Úlfarsson',
            NULL,
            'Matvælaráðherra ',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '743be34a-34db-44e9-ae43-6edf7c052635',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-02-28T14:04:04.047Z',
      'Ráðgjafar- og greiningarstöð',
      'C371B8B7-3108-4706-A24A-65695D82D662',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '743be34a-34db-44e9-ae43-6edf7c052635',
        '209abbae-ddf3-4ae9-a767-32ddb9d5ecd0'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '743be34a-34db-44e9-ae43-6edf7c052635',
        '78f7dd3e-5c6f-4f4a-a9fa-65e290abe94e'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '743be34a-34db-44e9-ae43-6edf7c052635',
        'e873b3d4-bbe5-43e7-92b8-04d972f40e1a'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '743be34a-34db-44e9-ae43-6edf7c052635',
        '0dc2128c-22f5-4b97-9e64-dee82efcd8e7'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'ddeb80bc-d0d2-41f8-b2fd-65e867ba203b',
      '743be34a-34db-44e9-ae43-6edf7c052635'
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
    '397448e6-8e06-4db0-a809-929d29e2fa69',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202301015',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '480853f2-a511-41b5-b663-df655741e77a',
    '75129AFB-7875-49C9-BEBE-A25BDB0AC3E4',
    '2023-01-15T05:55:27.476Z',
    '2023-01-15T05:55:27.476Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '5E9802BD-4CF4-43B5-91B7-F7DFD2FCE883',
    'fyrir Þekkingarsetur Þingeyinga.',
    '2023-02-08T14:25:26.075Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('397448e6-8e06-4db0-a809-929d29e2fa69','D7969CED-4273-4B82-985E-951882A11430');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8a137b61-9a3a-4cc2-ace1-ef8560a87704',
            'Ólöf Oddný Jónsdóttir',
            NULL,
            'Mennta- og barnamálaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '48a1c820-7481-4e44-ac31-2640055db3b1',
            'Valgerður Andradóttir',
            NULL,
            NULL,
            'Menningar- og viðskiptaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e2620711-8951-4455-ad71-b04acdc04e08',
            'Nína Ösp Einarsdóttir',
            NULL,
            NULL,
            'Umhverfis-, orku og loftslagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '65d7c37a-a5a7-4997-acf2-6b1c6c58894c',
            'Ragnheiður Jóhanna Karlsdóttir',
            NULL,
            'Dómsmálaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'cd105ab4-877d-43d3-8228-67ecf0ba975d',
            'Bryndís Ólafsdóttir',
            NULL,
            'Umhverfis-, orku og loftslagsráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'ecf6ea57-120b-44e5-bb5a-4be9a27127e6',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-01-15T05:55:27.476Z',
      'Sjúkratryggingar Íslands',
      '75129AFB-7875-49C9-BEBE-A25BDB0AC3E4',
      '8a137b61-9a3a-4cc2-ace1-ef8560a87704',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'ecf6ea57-120b-44e5-bb5a-4be9a27127e6',
        '8a137b61-9a3a-4cc2-ace1-ef8560a87704'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'ecf6ea57-120b-44e5-bb5a-4be9a27127e6',
        '48a1c820-7481-4e44-ac31-2640055db3b1'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'ecf6ea57-120b-44e5-bb5a-4be9a27127e6',
        'e2620711-8951-4455-ad71-b04acdc04e08'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'ecf6ea57-120b-44e5-bb5a-4be9a27127e6',
        '65d7c37a-a5a7-4997-acf2-6b1c6c58894c'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'ecf6ea57-120b-44e5-bb5a-4be9a27127e6',
        'cd105ab4-877d-43d3-8228-67ecf0ba975d'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '397448e6-8e06-4db0-a809-929d29e2fa69',
      'ecf6ea57-120b-44e5-bb5a-4be9a27127e6'
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
    'f4a20a6f-b609-4327-84b6-81802553a60e',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202307007',
    '799722be-5530-439a-91dc-606e129b030d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'D27889F0-BD14-4766-ADC8-721AEED7B87D',
    '2023-07-07T08:46:51.835Z',
    '2023-07-07T08:46:51.835Z',
    true,
    NULL,
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '2C066B02-324E-411F-9579-222BB4D9CFCE',
    'um almenna undanþágu frá búsetuskilyrðum hlutafélagalöggjafarinnar.',
    '2023-07-23T05:54:40.710Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('f4a20a6f-b609-4327-84b6-81802553a60e','7FC4300E-40DB-4963-8D37-3A8E6E8D1F9E');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('f4a20a6f-b609-4327-84b6-81802553a60e','EA749F4E-F99D-480D-80A1-F44D96316589');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('f4a20a6f-b609-4327-84b6-81802553a60e','7CF3B62A-F110-4C1E-ADA4-96D9CFED12DE');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '5deb968c-cbf9-48a3-81c8-5e0e92329b1f',
            'Valgerður Ylfa Björnsdóttir',
            NULL,
            NULL,
            'Félags- og vinnumálaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '466a495f-09fe-4a34-a3b1-621fe2116911',
            'Finnur Stefánsson',
            NULL,
            'Forsætisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'd1439f5f-a93a-476e-9a08-956b9ec033a0',
            'Jón Karl Stefánsson',
            NULL,
            NULL,
            'Heilbrigðisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '444ad561-716b-4f52-befb-ee1fdea7e2d4',
            'Oddur Þorsteinn Ólafsson',
            NULL,
            NULL,
            'Umhverfis-, orku og loftslagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '79ecc578-38dd-406f-82b1-553b386f818e',
            'Þórdís Ragnheiður Stefánsdóttir',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'f7f95dac-ccc6-40e5-acbc-3a6dbe8f17fd',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-07-07T08:46:51.835Z',
      'Heilbrigðisstofnun Austurlands',
      'D27889F0-BD14-4766-ADC8-721AEED7B87D',
      '5deb968c-cbf9-48a3-81c8-5e0e92329b1f',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f7f95dac-ccc6-40e5-acbc-3a6dbe8f17fd',
        '5deb968c-cbf9-48a3-81c8-5e0e92329b1f'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f7f95dac-ccc6-40e5-acbc-3a6dbe8f17fd',
        '466a495f-09fe-4a34-a3b1-621fe2116911'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f7f95dac-ccc6-40e5-acbc-3a6dbe8f17fd',
        'd1439f5f-a93a-476e-9a08-956b9ec033a0'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f7f95dac-ccc6-40e5-acbc-3a6dbe8f17fd',
        '444ad561-716b-4f52-befb-ee1fdea7e2d4'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f7f95dac-ccc6-40e5-acbc-3a6dbe8f17fd',
        '79ecc578-38dd-406f-82b1-553b386f818e'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'f4a20a6f-b609-4327-84b6-81802553a60e',
      'f7f95dac-ccc6-40e5-acbc-3a6dbe8f17fd'
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
    '2cb30051-4944-4599-a49d-ef32d8013955',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202308021',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '480853f2-a511-41b5-b663-df655741e77a',
    '5D6DBF40-5B8F-4134-BDF8-BD0FC8124878',
    '2023-08-21T12:02:47.226Z',
    '2023-08-21T12:02:47.226Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'fyrir Seyðisfjarðarhöfn.',
    '2023-09-17T03:04:01.369Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2cb30051-4944-4599-a49d-ef32d8013955','4B9417D5-C01B-436B-87ED-0FC135CC4421');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8968c7ec-0835-4d01-9083-54896c5ee277',
            'Úlfar Unnar Oddarson',
            NULL,
            'Stjórnarmenn',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7286ee31-f978-41f3-a373-813064cf879e',
            'Ingimar Finnur Yngvason',
            NULL,
            NULL,
            'Heilbrigðisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7812e62e-8abb-4ae2-b780-0675633c0e42',
            'Davíð Þorsteinn Unnarsson',
            NULL,
            NULL,
            'Framkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'f1f7a77b-b8f4-4b8c-b6a3-75e843503d3b',
            'Valdimar Ýmir Ólafsson',
            NULL,
            NULL,
            'Aðstoðarframkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '2b880fce-a9e5-427e-9ce0-204320fb003f',
            'Íris Oddardóttir',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '56570919-2ea2-4d4a-b0e5-75404420e3a0',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-08-21T12:02:47.226Z',
      'Gæða- og eftirlitsstofnun velferðamála',
      '5D6DBF40-5B8F-4134-BDF8-BD0FC8124878',
      '8968c7ec-0835-4d01-9083-54896c5ee277',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '56570919-2ea2-4d4a-b0e5-75404420e3a0',
        '8968c7ec-0835-4d01-9083-54896c5ee277'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '56570919-2ea2-4d4a-b0e5-75404420e3a0',
        '7286ee31-f978-41f3-a373-813064cf879e'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '56570919-2ea2-4d4a-b0e5-75404420e3a0',
        '7812e62e-8abb-4ae2-b780-0675633c0e42'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '56570919-2ea2-4d4a-b0e5-75404420e3a0',
        'f1f7a77b-b8f4-4b8c-b6a3-75e843503d3b'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '56570919-2ea2-4d4a-b0e5-75404420e3a0',
        '2b880fce-a9e5-427e-9ce0-204320fb003f'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '2cb30051-4944-4599-a49d-ef32d8013955',
      '56570919-2ea2-4d4a-b0e5-75404420e3a0'
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
    'b7c81fc7-eb13-457a-bab3-9fbdca0d8925',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202309004',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'DE4679EB-C244-4D90-87AC-ADB7FEB00BC1',
    '2023-09-04T15:27:26.329Z',
    '2023-09-04T15:27:26.329Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um val á nemendum til náms í hjúkrunarfræði við heilbrigðisdeild Háskólans á Akureyri.',
    '2023-09-09T15:36:47.024Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b7c81fc7-eb13-457a-bab3-9fbdca0d8925','551185DF-5517-4586-9C74-F3B981436BEE');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b7c81fc7-eb13-457a-bab3-9fbdca0d8925','BA74C84F-ECDB-49ED-9D96-CAA1ACEFEC7C');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b7c81fc7-eb13-457a-bab3-9fbdca0d8925','0EB24507-80D1-4D7C-B1CE-59FDDBDEC646');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b7c81fc7-eb13-457a-bab3-9fbdca0d8925','D1623FE0-EB23-4686-A98A-A36EEB6F59AD');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('b7c81fc7-eb13-457a-bab3-9fbdca0d8925','8D0A8F37-8551-4979-BC39-4E9874626BA5');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '956417cc-2738-4a85-b236-84ccc846fbd7',
            'Ragnar Oddarson',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8dc0bb7f-94df-4556-9ef5-03bf7914484d',
            'Stefán Pétur Tómasson',
            NULL,
            'Menningar- og viðskiptaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e2d36d81-6c47-4392-917f-a180480720c8',
            'Jóhanna Oddný Stefánsdóttir',
            NULL,
            NULL,
            'Sendiherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '4a12a63f-c4c3-42a3-9c45-81e3197ab543',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-09-04T15:27:26.329Z',
      'Sinfóníuhljómsveit Íslands',
      'DE4679EB-C244-4D90-87AC-ADB7FEB00BC1',
      '956417cc-2738-4a85-b236-84ccc846fbd7',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '4a12a63f-c4c3-42a3-9c45-81e3197ab543',
        '956417cc-2738-4a85-b236-84ccc846fbd7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '4a12a63f-c4c3-42a3-9c45-81e3197ab543',
        '8dc0bb7f-94df-4556-9ef5-03bf7914484d'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '4a12a63f-c4c3-42a3-9c45-81e3197ab543',
        'e2d36d81-6c47-4392-917f-a180480720c8'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'b7c81fc7-eb13-457a-bab3-9fbdca0d8925',
      '4a12a63f-c4c3-42a3-9c45-81e3197ab543'
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
    '7fb66d66-7f52-4aef-955a-40a66b889fc2',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202306007',
    '799722be-5530-439a-91dc-606e129b030d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '38D2C9E3-6EA7-42A4-BC07-277242975162',
    '2023-06-07T12:05:10.608Z',
    '2023-06-07T12:05:10.608Z',
    false,
    NULL,
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'fyrir rotþróargjald í Garðabæ.',
    '2023-06-23T10:07:33.463Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('7fb66d66-7f52-4aef-955a-40a66b889fc2','9E7B69EE-79DC-4DF3-9246-C615766C1BBC');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('7fb66d66-7f52-4aef-955a-40a66b889fc2','93360436-7D7E-463D-9477-C2742A99C9B6');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('7fb66d66-7f52-4aef-955a-40a66b889fc2','A9F67E59-A8E5-425E-A50F-A730614C5E22');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('7fb66d66-7f52-4aef-955a-40a66b889fc2','F84C85E9-AB4A-4BFF-BA70-C293539A4C22');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('7fb66d66-7f52-4aef-955a-40a66b889fc2','189CF6F2-C855-4EF1-B5AA-633C6E5C16C2');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '9579776a-b6d2-4b81-841a-ff2722122e84',
            'Valdimar Ragnarsson',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7ae4d5ef-d88e-4455-a671-849ff16064c7',
            'Dagmar Jónsdóttir',
            NULL,
            'Félags- og vinnumálaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e3d73ddc-4517-4460-92ae-62ec118549f8',
            'Úlfhildur Ösp Oddardóttir',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7607c48d-8646-4a14-9d1c-4cadf67de8ee',
            'Davíð Pétur Njálsson',
            NULL,
            NULL,
            'Heilbrigðisráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '083e2285-bdd4-446c-9b54-0ace0a504185',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-06-07T12:05:10.608Z',
      'Landhelgisgæsla Íslands',
      '38D2C9E3-6EA7-42A4-BC07-277242975162',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '083e2285-bdd4-446c-9b54-0ace0a504185',
        '9579776a-b6d2-4b81-841a-ff2722122e84'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '083e2285-bdd4-446c-9b54-0ace0a504185',
        '7ae4d5ef-d88e-4455-a671-849ff16064c7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '083e2285-bdd4-446c-9b54-0ace0a504185',
        'e3d73ddc-4517-4460-92ae-62ec118549f8'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '083e2285-bdd4-446c-9b54-0ace0a504185',
        '7607c48d-8646-4a14-9d1c-4cadf67de8ee'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '7fb66d66-7f52-4aef-955a-40a66b889fc2',
      '083e2285-bdd4-446c-9b54-0ace0a504185'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '826e4d8e-1030-4670-800d-bdd34b6ec783',
            'Gunnar Andri Ögmundarson',
            NULL,
            'Matvælaráðherra ',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '28efcd90-cbdf-4199-a83e-2a8acbc1d7e4',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-06-07T12:05:10.608Z',
      'Þjóðminjasafn Íslands',
      '38D2C9E3-6EA7-42A4-BC07-277242975162',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '28efcd90-cbdf-4199-a83e-2a8acbc1d7e4',
        '826e4d8e-1030-4670-800d-bdd34b6ec783'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '7fb66d66-7f52-4aef-955a-40a66b889fc2',
      '28efcd90-cbdf-4199-a83e-2a8acbc1d7e4'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '3f47d807-da66-48b2-9a52-744c8247df36',
            'Unnur Bryndís Lárusdóttir',
            NULL,
            'Forsætisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '332cce11-74eb-48c2-8891-8862ba033d78',
            'Ragnar Njáll Einarsson',
            NULL,
            'Dómari',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '958a38ec-62dc-46dc-9939-146c79a3e757',
            'Ólafur Einarsson',
            NULL,
            NULL,
            'Félags- og vinnumálaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '949189b0-62a3-4996-89b9-f68da12d9e2e',
            'Gunnar Gunnarsson',
            NULL,
            'Dómari',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '365f92b2-eb65-4ef5-b175-ca9b8d355529',
            'Bryndís Andradóttir',
            NULL,
            NULL,
            'Framkvæmdarstjóri'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '2b1ad3a8-0f63-47c9-982e-1655910a37df',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-06-07T12:05:10.608Z',
      'Fjársýsla ríkisins',
      '38D2C9E3-6EA7-42A4-BC07-277242975162',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2b1ad3a8-0f63-47c9-982e-1655910a37df',
        '3f47d807-da66-48b2-9a52-744c8247df36'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2b1ad3a8-0f63-47c9-982e-1655910a37df',
        '332cce11-74eb-48c2-8891-8862ba033d78'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2b1ad3a8-0f63-47c9-982e-1655910a37df',
        '958a38ec-62dc-46dc-9939-146c79a3e757'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2b1ad3a8-0f63-47c9-982e-1655910a37df',
        '949189b0-62a3-4996-89b9-f68da12d9e2e'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2b1ad3a8-0f63-47c9-982e-1655910a37df',
        '365f92b2-eb65-4ef5-b175-ca9b8d355529'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '7fb66d66-7f52-4aef-955a-40a66b889fc2',
      '2b1ad3a8-0f63-47c9-982e-1655910a37df'
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
    '83fc26c4-4fa5-4024-8451-72c1a25c354f',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202401009',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'E5A35CF9-DC87-4DA7-85A2-06EB5D43812F',
    '2024-01-09T15:34:21.427Z',
    '2024-01-09T15:34:21.427Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '505C6D03-B86D-4D2D-8112-274DB96E6664',
    'um breytingu á reglugerð um jöfnun tekjutaps sveitarfélaga vegna lækkunar tekna af fasteignaskatti, nr. 80/2001, með síðari breytingum.',
    '2024-01-19T16:36:23.606Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('83fc26c4-4fa5-4024-8451-72c1a25c354f','BB19B0F4-6DF9-49A4-8DC4-E48F35BC67A5');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('83fc26c4-4fa5-4024-8451-72c1a25c354f','DE8AC9BA-DF73-4353-A353-0E7F2D843D36');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '5b39cf1a-dc15-4084-bc10-29ff9c588db4',
            'Ögmundur Stefánsson',
            NULL,
            'Matvælaráðherra ',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8b057c5d-8169-4b6a-b6da-77d618c8c2dc',
            'Ingimar Tómasson',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'de7e0bf4-d9fa-42ea-af9c-f643c48d0461',
            'Pétur Unnarsson',
            NULL,
            NULL,
            'Framkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'ec89be4c-1dd1-45dc-9465-2400c27e39d4',
            'Helga Valgerður Oddardóttir',
            NULL,
            'Varaseðlabankastjóri',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7e97a119-f073-4add-bc57-361d9afd935a',
            'Gunnar Gunnarsson',
            NULL,
            'Sendiherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '30052b55-9084-4579-822e-848c499e10ee',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2024-01-09T15:34:21.427Z',
      'Tryggingastofnun ríkisins',
      'E5A35CF9-DC87-4DA7-85A2-06EB5D43812F',
      '5b39cf1a-dc15-4084-bc10-29ff9c588db4',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '30052b55-9084-4579-822e-848c499e10ee',
        '5b39cf1a-dc15-4084-bc10-29ff9c588db4'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '30052b55-9084-4579-822e-848c499e10ee',
        '8b057c5d-8169-4b6a-b6da-77d618c8c2dc'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '30052b55-9084-4579-822e-848c499e10ee',
        'de7e0bf4-d9fa-42ea-af9c-f643c48d0461'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '30052b55-9084-4579-822e-848c499e10ee',
        'ec89be4c-1dd1-45dc-9465-2400c27e39d4'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '30052b55-9084-4579-822e-848c499e10ee',
        '7e97a119-f073-4add-bc57-361d9afd935a'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '83fc26c4-4fa5-4024-8451-72c1a25c354f',
      '30052b55-9084-4579-822e-848c499e10ee'
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
    '5c970646-8fb8-4d9b-8162-bdfe1aff0c98',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202404004',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '480853f2-a511-41b5-b663-df655741e77a',
    '605589BF-9465-4832-92DE-2F443677961B',
    '2024-04-04T05:29:17.754Z',
    '2024-04-04T05:29:17.754Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '7a6a59ac-45ed-401f-b2a3-8480fd4b6438',
    'um Orkuveitu Reykjavíkur.',
    '2024-04-19T04:25:00.933Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('5c970646-8fb8-4d9b-8162-bdfe1aff0c98','D7969CED-4273-4B82-985E-951882A11430');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('5c970646-8fb8-4d9b-8162-bdfe1aff0c98','D9027FAC-94E2-4072-ABF8-9E63B21CA948');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'aade915a-37e2-4ea2-aac9-817802b11a75',
            'Helga Tómasdóttir',
            NULL,
            NULL,
            'Bankaráðsmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'bf71873c-36b3-4d2b-843e-645d55bfe5c3',
            'Ýr Ragnarsdóttir',
            NULL,
            NULL,
            'Innviðaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '00bc5b0e-3948-47cf-a5e4-d4bb2860b8e7',
            'Úlfhildur Lilja Úlfarsdóttir',
            NULL,
            'Heilbrigðisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'b9bd1ab2-88c5-407a-aab7-f57ae42c67b7',
            'Íris Margrét Ýmirsdóttir',
            NULL,
            NULL,
            'Félags- og vinnumálaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '6411e61a-96dd-49d3-b04f-6995f1c39c8e',
            'Andri Njálsson',
            NULL,
            NULL,
            'Dómsmálaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'd53b4088-1373-4227-97b8-6808235dea67',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-04-04T05:29:17.754Z',
      'Héraðssaksóknari',
      '605589BF-9465-4832-92DE-2F443677961B',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd53b4088-1373-4227-97b8-6808235dea67',
        'aade915a-37e2-4ea2-aac9-817802b11a75'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd53b4088-1373-4227-97b8-6808235dea67',
        'bf71873c-36b3-4d2b-843e-645d55bfe5c3'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd53b4088-1373-4227-97b8-6808235dea67',
        '00bc5b0e-3948-47cf-a5e4-d4bb2860b8e7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd53b4088-1373-4227-97b8-6808235dea67',
        'b9bd1ab2-88c5-407a-aab7-f57ae42c67b7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd53b4088-1373-4227-97b8-6808235dea67',
        '6411e61a-96dd-49d3-b04f-6995f1c39c8e'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '5c970646-8fb8-4d9b-8162-bdfe1aff0c98',
      'd53b4088-1373-4227-97b8-6808235dea67'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '0db6c4f3-85fd-4ef5-b5cf-8f5f99024fb2',
            'Ingimar Jónsson',
            NULL,
            NULL,
            'Innviðaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '5bbb70ee-cf24-47ec-960c-54e36dda2cfc',
            'Ösp Stefánsdóttir',
            NULL,
            NULL,
            'Aðstoðarframkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'bf5e472e-5dab-414f-a12a-7523c7098667',
            'Magnús Lárus Þorsteinsson',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '216abd32-2cef-4271-83bd-29d17b54e05e',
            'Helga Helga Karlsdóttir',
            NULL,
            NULL,
            'Dómsmálaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'a60aafb6-88db-4dc2-a23e-e5cfd278aa8f',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-04-04T05:29:17.754Z',
      'Byggðastofnun',
      '605589BF-9465-4832-92DE-2F443677961B',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a60aafb6-88db-4dc2-a23e-e5cfd278aa8f',
        '0db6c4f3-85fd-4ef5-b5cf-8f5f99024fb2'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a60aafb6-88db-4dc2-a23e-e5cfd278aa8f',
        '5bbb70ee-cf24-47ec-960c-54e36dda2cfc'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a60aafb6-88db-4dc2-a23e-e5cfd278aa8f',
        'bf5e472e-5dab-414f-a12a-7523c7098667'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a60aafb6-88db-4dc2-a23e-e5cfd278aa8f',
        '216abd32-2cef-4271-83bd-29d17b54e05e'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '5c970646-8fb8-4d9b-8162-bdfe1aff0c98',
      'a60aafb6-88db-4dc2-a23e-e5cfd278aa8f'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '91c4d009-2acf-4e49-bb4d-b44254314d53',
            'Ólafur Yngvi Karlsson',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '321d5996-39c2-4d61-ad02-3ea2b859ab19',
            'Íris Ögmundardóttir',
            NULL,
            'Matvælaráðherra ',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'd85524e5-f902-4c06-ab7e-a92f061f0881',
            'Yngvi Magnússon',
            NULL,
            NULL,
            'Framkvæmdarstjóri'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '57fc1780-6f05-48c8-8b34-3350f89ceb89',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-04-04T05:29:17.754Z',
      'Veðurstofa Íslands',
      '605589BF-9465-4832-92DE-2F443677961B',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '57fc1780-6f05-48c8-8b34-3350f89ceb89',
        '91c4d009-2acf-4e49-bb4d-b44254314d53'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '57fc1780-6f05-48c8-8b34-3350f89ceb89',
        '321d5996-39c2-4d61-ad02-3ea2b859ab19'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '57fc1780-6f05-48c8-8b34-3350f89ceb89',
        'd85524e5-f902-4c06-ab7e-a92f061f0881'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '5c970646-8fb8-4d9b-8162-bdfe1aff0c98',
      '57fc1780-6f05-48c8-8b34-3350f89ceb89'
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
    'ceba722b-d53a-46b2-bee2-5f8b445e3565',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202304019',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'DCBA20D9-6B97-40FF-8C99-FCACBA5BB1DB',
    '2023-04-19T08:49:20.864Z',
    '2023-04-19T08:49:20.864Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'fyrir stofngjald fráveitu, fráveitugjald og rotþróargjald í Borgarbyggð.',
    '2023-05-19T01:02:23.355Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('ceba722b-d53a-46b2-bee2-5f8b445e3565','E0331E8E-B397-456D-85A2-7E48761E8C40');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('ceba722b-d53a-46b2-bee2-5f8b445e3565','4EC5280F-3DB2-4E4C-BF6A-7C32079C7199');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'cb8fbd8d-169e-4de3-8200-f47dcdd97b33',
            'Ýr Yngvadóttir',
            NULL,
            NULL,
            'Menningar- og viðskiptaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8596c0a2-0c9c-495a-ba8e-fe3032f7ea8c',
            'Ragnar Hjaltason',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '385ddbf9-10d6-4e47-a3fe-bb4b84266815',
            'Kristín Ingibjörg Njálsdóttir',
            NULL,
            'Utanríkisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '2d62847b-7c90-45b7-aac9-a7f16120f4af',
            'Oddur Oddarson',
            NULL,
            NULL,
            'Stjórnarmenn'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '9ffdf88e-fe5e-4933-b466-e019937c123d',
            'Kristín Andradóttir',
            NULL,
            'Félags- og vinnumálaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '1ed5e1d6-7d09-4af9-b6b1-8736506275a5',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-04-19T08:49:20.864Z',
      'Náttúruhamfaratrygging Íslands',
      'DCBA20D9-6B97-40FF-8C99-FCACBA5BB1DB',
      'cb8fbd8d-169e-4de3-8200-f47dcdd97b33',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '1ed5e1d6-7d09-4af9-b6b1-8736506275a5',
        'cb8fbd8d-169e-4de3-8200-f47dcdd97b33'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '1ed5e1d6-7d09-4af9-b6b1-8736506275a5',
        '8596c0a2-0c9c-495a-ba8e-fe3032f7ea8c'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '1ed5e1d6-7d09-4af9-b6b1-8736506275a5',
        '385ddbf9-10d6-4e47-a3fe-bb4b84266815'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '1ed5e1d6-7d09-4af9-b6b1-8736506275a5',
        '2d62847b-7c90-45b7-aac9-a7f16120f4af'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '1ed5e1d6-7d09-4af9-b6b1-8736506275a5',
        '9ffdf88e-fe5e-4933-b466-e019937c123d'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'ceba722b-d53a-46b2-bee2-5f8b445e3565',
      '1ed5e1d6-7d09-4af9-b6b1-8736506275a5'
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
    '4cb4a3bf-0fc2-4af5-807a-24b3a84cb9e0',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202303011',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '7BE868F9-DACF-45E7-A004-F6CEA24113C7',
    '2023-03-11T10:02:45.611Z',
    '2023-03-11T10:02:45.611Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'fyrir Hvammstangahöfn.',
    '2023-04-03T20:28:05.869Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('4cb4a3bf-0fc2-4af5-807a-24b3a84cb9e0','0D9D65AE-2C52-4FE5-AA81-F54FA8F6328A');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('4cb4a3bf-0fc2-4af5-807a-24b3a84cb9e0','BF7C4710-B943-4B04-BF23-4EF8505AC670');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('4cb4a3bf-0fc2-4af5-807a-24b3a84cb9e0','D7CA4220-43B9-44B2-BF54-E840AE164B63');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('4cb4a3bf-0fc2-4af5-807a-24b3a84cb9e0','FCCDA715-1F30-42D2-82B8-BFC7AD661186');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '99f9ae5a-aa31-4f7a-a66f-ef270e0b0879',
            'Ólafur Ýmirsson',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '68cb1811-25a3-405f-91ea-cad057a31ebc',
            'Finnur Andri Finnsson',
            NULL,
            NULL,
            'Dómari'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '314a048e-fceb-4929-8db8-d530e23f043b',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-03-11T10:02:45.611Z',
      'Borgarholtsskóli',
      '7BE868F9-DACF-45E7-A004-F6CEA24113C7',
      '99f9ae5a-aa31-4f7a-a66f-ef270e0b0879',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '314a048e-fceb-4929-8db8-d530e23f043b',
        '99f9ae5a-aa31-4f7a-a66f-ef270e0b0879'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '314a048e-fceb-4929-8db8-d530e23f043b',
        '68cb1811-25a3-405f-91ea-cad057a31ebc'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '4cb4a3bf-0fc2-4af5-807a-24b3a84cb9e0',
      '314a048e-fceb-4929-8db8-d530e23f043b'
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
    '1cffb1cb-c035-4d2a-8e32-5de58ecefba4',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202301028',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '480853f2-a511-41b5-b663-df655741e77a',
    '60CA7B5C-9828-4A40-9E01-C9F31996F06B',
    '2023-01-28T04:10:00.876Z',
    '2023-01-28T04:10:00.876Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um sorphirðu í Garðabæ.',
    '2023-02-24T04:50:44.822Z',
    NULL
  );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'fffe665e-be0f-429e-999a-f64faaf4bb10',
            'Úlfhildur Tanja Karlsdóttir',
            NULL,
            NULL,
            'Bankaráðsmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'f6294fe3-e6b2-4a30-ab41-362e6bef0a68',
            'Ösp Njálsdóttir',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '144e881f-41ee-4331-b356-89da2ae062d9',
            'Ólöf Jónsdóttir',
            NULL,
            'Dómsmálaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '6e6cdbe5-44b7-4c3b-b82a-4f433a61aee3',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-01-28T04:10:00.876Z',
      'Skipulagsstofnun',
      '60CA7B5C-9828-4A40-9E01-C9F31996F06B',
      'fffe665e-be0f-429e-999a-f64faaf4bb10',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6e6cdbe5-44b7-4c3b-b82a-4f433a61aee3',
        'fffe665e-be0f-429e-999a-f64faaf4bb10'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6e6cdbe5-44b7-4c3b-b82a-4f433a61aee3',
        'f6294fe3-e6b2-4a30-ab41-362e6bef0a68'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6e6cdbe5-44b7-4c3b-b82a-4f433a61aee3',
        '144e881f-41ee-4331-b356-89da2ae062d9'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '1cffb1cb-c035-4d2a-8e32-5de58ecefba4',
      '6e6cdbe5-44b7-4c3b-b82a-4f433a61aee3'
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
    '13dafae4-bed5-4ba1-a657-d389db278b9c',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202312008',
    '799722be-5530-439a-91dc-606e129b030d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '7D46BBB1-98DC-428E-A7CB-CBE8E3752D4A',
    '2023-12-08T14:23:11.224Z',
    '2023-12-08T14:23:11.224Z',
    false,
    NULL,
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    'A50189B3-B9CA-4E1E-9103-1F6706252372',
    'um atvinnuleysistryggingar.',
    '2023-12-23T11:24:37.044Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('13dafae4-bed5-4ba1-a657-d389db278b9c','3EBEF336-FFA2-45F5-8891-54A4B56E3070');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('13dafae4-bed5-4ba1-a657-d389db278b9c','2E39D89E-5E93-4E22-B855-8ACAE73F16CB');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('13dafae4-bed5-4ba1-a657-d389db278b9c','ED300CCA-5E85-4209-AB42-96721E0AC9C8');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('13dafae4-bed5-4ba1-a657-d389db278b9c','654E8ED3-4C56-46E9-8FDC-8D89D428C3CD');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('13dafae4-bed5-4ba1-a657-d389db278b9c','9DFECF63-1405-420D-836F-C71311B1F48B');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8aec87f9-2f15-4c4d-9e94-d0833b973bb7',
            'Njáll Unnarsson',
            NULL,
            NULL,
            'Umhverfis-, orku og loftslagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'b8757987-cade-4201-9d58-b0c385e88409',
            'Ólöf Unnarsdóttir',
            NULL,
            'Félags- og vinnumálaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '46dde273-e4f4-44ef-9c9e-f98565fc575a',
            'Ólöf Andradóttir',
            NULL,
            NULL,
            'Utanríkisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'c9e7ebf7-1a46-4469-a999-1abf0738fa93',
            'Ólöf Davíðsdóttir',
            NULL,
            NULL,
            'Umhverfis-, orku og loftslagsráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'f8dadb9c-c639-4005-8512-cb757a787178',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-12-08T14:23:11.224Z',
      'Umhverfisstofnun',
      '7D46BBB1-98DC-428E-A7CB-CBE8E3752D4A',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f8dadb9c-c639-4005-8512-cb757a787178',
        '8aec87f9-2f15-4c4d-9e94-d0833b973bb7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f8dadb9c-c639-4005-8512-cb757a787178',
        'b8757987-cade-4201-9d58-b0c385e88409'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f8dadb9c-c639-4005-8512-cb757a787178',
        '46dde273-e4f4-44ef-9c9e-f98565fc575a'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f8dadb9c-c639-4005-8512-cb757a787178',
        'c9e7ebf7-1a46-4469-a999-1abf0738fa93'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '13dafae4-bed5-4ba1-a657-d389db278b9c',
      'f8dadb9c-c639-4005-8512-cb757a787178'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '3dc2fd89-e4a5-4834-8ae2-f29f987b73de',
            'Oddur Oddarson',
            NULL,
            'Dómari',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'bb36ad01-2fcd-4318-8a79-61052d41bb5a',
            'Úlfar Björn Ólafsson',
            NULL,
            'Dómsmálaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '17ffe730-a2b6-4dfa-a402-a3ad899df37c',
            'Stefán Valdimarsson',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'bd7dd296-0848-4206-8f97-8a33f67df112',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-12-08T14:23:11.224Z',
      'Landskjörstjórn',
      '7D46BBB1-98DC-428E-A7CB-CBE8E3752D4A',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'bd7dd296-0848-4206-8f97-8a33f67df112',
        '3dc2fd89-e4a5-4834-8ae2-f29f987b73de'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'bd7dd296-0848-4206-8f97-8a33f67df112',
        'bb36ad01-2fcd-4318-8a79-61052d41bb5a'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'bd7dd296-0848-4206-8f97-8a33f67df112',
        '17ffe730-a2b6-4dfa-a402-a3ad899df37c'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '13dafae4-bed5-4ba1-a657-d389db278b9c',
      'bd7dd296-0848-4206-8f97-8a33f67df112'
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
    'f9897437-6f8c-4417-a973-25850745d4d6',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202310027',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '27921FDE-6750-4322-B87D-25DEC1094B01',
    '2023-10-27T12:47:08.603Z',
    '2023-10-27T12:47:08.603Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um að forseti Íslands sé kominn heim og tekinn við stjórnarstörfum.',
    '2023-11-10T11:17:25.701Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('f9897437-6f8c-4417-a973-25850745d4d6','003E856E-F09B-411F-B404-B0EAE510AC6C');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8a8c5f89-c1bc-4647-91b7-2fec75d81c3c',
            'Gunnar Davíðsson',
            NULL,
            'Félags- og vinnumálaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'fafe2e58-4800-4fd5-971e-960685e076cc',
            'Karl Tómas Unnarsson',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'c4e73ced-41b8-4b42-bbe9-18117cf6cfed',
            'Valdimar Valdimar Tómasson',
            NULL,
            'Framkvæmdarstjóri',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '96b9d46d-e5a4-4d40-9ea2-12325a255394',
            'Björn Magnús Oddarson',
            NULL,
            'Sendiherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '5233cdeb-b283-41c0-ac0f-587a637e83ff',
            'Ragnheiður Valgerður Tómasdóttir',
            NULL,
            'Mennta- og barnamálaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'e6f7afad-2504-427c-9fbe-c1931638c4a4',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-10-27T12:47:08.603Z',
      'Úrskurðarnefnd velferðarmála',
      '27921FDE-6750-4322-B87D-25DEC1094B01',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e6f7afad-2504-427c-9fbe-c1931638c4a4',
        '8a8c5f89-c1bc-4647-91b7-2fec75d81c3c'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e6f7afad-2504-427c-9fbe-c1931638c4a4',
        'fafe2e58-4800-4fd5-971e-960685e076cc'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e6f7afad-2504-427c-9fbe-c1931638c4a4',
        'c4e73ced-41b8-4b42-bbe9-18117cf6cfed'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e6f7afad-2504-427c-9fbe-c1931638c4a4',
        '96b9d46d-e5a4-4d40-9ea2-12325a255394'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e6f7afad-2504-427c-9fbe-c1931638c4a4',
        '5233cdeb-b283-41c0-ac0f-587a637e83ff'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'f9897437-6f8c-4417-a973-25850745d4d6',
      'e6f7afad-2504-427c-9fbe-c1931638c4a4'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e9834ee5-b72c-4749-a1a1-56d680863269',
            'Karl Ingimar Tómasson',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '572d237b-c601-4383-acf7-cc1c94301d57',
            'Lárus Úlfarsson',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'd7ae8376-e28e-4c39-b9db-9de222f5e202',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-10-27T12:47:08.603Z',
      'Framkvæmdasýslan - Ríkiseignir',
      '27921FDE-6750-4322-B87D-25DEC1094B01',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd7ae8376-e28e-4c39-b9db-9de222f5e202',
        'e9834ee5-b72c-4749-a1a1-56d680863269'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd7ae8376-e28e-4c39-b9db-9de222f5e202',
        '572d237b-c601-4383-acf7-cc1c94301d57'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'f9897437-6f8c-4417-a973-25850745d4d6',
      'd7ae8376-e28e-4c39-b9db-9de222f5e202'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'f164380c-882f-4b84-8e2c-8974c7f7ddcd',
            'Ýr Tanja Ingimarsdóttir',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '1aa3cc5a-6482-434b-a477-a721e38bad01',
            'Ylfa Lilja Ólafsdóttir',
            NULL,
            NULL,
            'Aðstoðarframkvæmdarstjóri'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '27ac92c5-29f3-406f-b4e2-c0b6541e9481',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-10-27T12:47:08.603Z',
      'Úrskurðarnefnd umhverfis- og auðlindamála',
      '27921FDE-6750-4322-B87D-25DEC1094B01',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '27ac92c5-29f3-406f-b4e2-c0b6541e9481',
        'f164380c-882f-4b84-8e2c-8974c7f7ddcd'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '27ac92c5-29f3-406f-b4e2-c0b6541e9481',
        '1aa3cc5a-6482-434b-a477-a721e38bad01'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'f9897437-6f8c-4417-a973-25850745d4d6',
      '27ac92c5-29f3-406f-b4e2-c0b6541e9481'
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
    'e6b64aed-35fe-40f9-a381-8adfdd00a5bd',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202309025',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '6CF4E5DE-9930-4B9C-8120-68ADD0D836EC',
    '2023-09-25T21:10:21.059Z',
    '2023-09-25T21:10:21.059Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um deiliskipulag í Hrunamannahreppi.',
    '2023-10-09T03:37:47.644Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('e6b64aed-35fe-40f9-a381-8adfdd00a5bd','D7CA4220-43B9-44B2-BF54-E840AE164B63');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('e6b64aed-35fe-40f9-a381-8adfdd00a5bd','C6D61DAC-40BF-41F3-A9CA-00F4DA2D6294');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('e6b64aed-35fe-40f9-a381-8adfdd00a5bd','D84E8865-9597-4FA3-AC5F-886B47C40BAB');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '82254b36-0fce-43a4-96e6-f8215653c90f',
            'Yngvi Magnús Ögmundarson',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'cb83c691-0099-4dc1-b6c7-80a623309697',
            'Ingibjörg Íris Ólafsdóttir',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e3606e28-9fb4-4524-b276-08416fff6fa5',
            'Valgerður Tanja Oddardóttir',
            NULL,
            NULL,
            'Bankaráðsmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'da63e3a3-ce39-4f28-832f-293235057b20',
            'Oddur Pétursson',
            NULL,
            NULL,
            'Umhverfis-, orku og loftslagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7e1e9b7d-837d-4792-99f2-a7fd6e95927e',
            'Ösp Úlfarsdóttir',
            NULL,
            NULL,
            'Stjórnarmenn'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '7647af5d-40c0-4a52-ae1c-467627141a40',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-09-25T21:10:21.059Z',
      'Sýslumaðurinn í Vestmannaeyjum',
      '6CF4E5DE-9930-4B9C-8120-68ADD0D836EC',
      '82254b36-0fce-43a4-96e6-f8215653c90f',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '7647af5d-40c0-4a52-ae1c-467627141a40',
        '82254b36-0fce-43a4-96e6-f8215653c90f'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '7647af5d-40c0-4a52-ae1c-467627141a40',
        'cb83c691-0099-4dc1-b6c7-80a623309697'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '7647af5d-40c0-4a52-ae1c-467627141a40',
        'e3606e28-9fb4-4524-b276-08416fff6fa5'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '7647af5d-40c0-4a52-ae1c-467627141a40',
        'da63e3a3-ce39-4f28-832f-293235057b20'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '7647af5d-40c0-4a52-ae1c-467627141a40',
        '7e1e9b7d-837d-4792-99f2-a7fd6e95927e'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'e6b64aed-35fe-40f9-a381-8adfdd00a5bd',
      '7647af5d-40c0-4a52-ae1c-467627141a40'
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
    '32fa140d-ff0e-467b-8b06-dec5e8bae6ff',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202405018',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'C77A32B4-D319-40AA-AC2C-3994379C8515',
    '2024-05-18T12:05:17.141Z',
    '2024-05-18T12:05:17.141Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '5771F14B-0BE8-4290-87B1-CE2FCF860419',
    'um breytingu á reglugerð nr. 822/2004 um gerð og búnað ökutækja.',
    '2024-06-05T21:52:28.686Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('32fa140d-ff0e-467b-8b06-dec5e8bae6ff','ED300CCA-5E85-4209-AB42-96721E0AC9C8');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('32fa140d-ff0e-467b-8b06-dec5e8bae6ff','C826BA71-A1D4-427F-A1A3-85D23C5140EE');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('32fa140d-ff0e-467b-8b06-dec5e8bae6ff','286430A5-418A-4882-AA1F-530D8F265582');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'c57e9f0f-c0c8-4b90-9b2e-5dbc2e759843',
            'Dagmar Valgerður Yngvadóttir',
            NULL,
            'Fjármála- og efnahagsráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '0ef2482c-588f-4ee7-a0f7-fb109025812c',
            'Ingibjörg Perla Jónsdóttir',
            NULL,
            'Stjórnarmenn',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a907e119-8c96-416f-a6c4-d3fef4609bcd',
            'Ingimar Þorsteinn Yngvason',
            NULL,
            NULL,
            'Matvælaráðherra '
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '31a2ed88-1c72-4339-be4d-633d9288c623',
            'Úlfhildur Sigríður Gunnarsdóttir',
            NULL,
            NULL,
            'Stjórnarmenn'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'd3e8944e-847c-466b-914d-dd8074bf4688',
            'Yngvi Njálsson',
            NULL,
            NULL,
            'Félags- og vinnumálaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'eaddcb2d-f5ae-4265-adbc-57aa1b9dc8e9',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-05-18T12:05:17.141Z',
      'Orkustofnun',
      'C77A32B4-D319-40AA-AC2C-3994379C8515',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'eaddcb2d-f5ae-4265-adbc-57aa1b9dc8e9',
        'c57e9f0f-c0c8-4b90-9b2e-5dbc2e759843'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'eaddcb2d-f5ae-4265-adbc-57aa1b9dc8e9',
        '0ef2482c-588f-4ee7-a0f7-fb109025812c'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'eaddcb2d-f5ae-4265-adbc-57aa1b9dc8e9',
        'a907e119-8c96-416f-a6c4-d3fef4609bcd'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'eaddcb2d-f5ae-4265-adbc-57aa1b9dc8e9',
        '31a2ed88-1c72-4339-be4d-633d9288c623'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'eaddcb2d-f5ae-4265-adbc-57aa1b9dc8e9',
        'd3e8944e-847c-466b-914d-dd8074bf4688'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '32fa140d-ff0e-467b-8b06-dec5e8bae6ff',
      'eaddcb2d-f5ae-4265-adbc-57aa1b9dc8e9'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7380c392-c879-4e16-a6dc-4c6b1aba9c11',
            'Magnús Gunnar Oddarson',
            NULL,
            'Umhverfis-, orku og loftslagsráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'f4a20b48-57e0-4259-b3ea-524e69dfde4c',
            'Ragnheiður Ylfa Andradóttir',
            NULL,
            NULL,
            'Þingmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '47f1f7d7-ac12-4a5c-8572-41ab375ab7b3',
            'Björn Karl Pétursson',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '5fdf99a6-0693-498d-adf9-2eb401059796',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-05-18T12:05:17.141Z',
      'Náttúruminjasafn Íslands',
      'C77A32B4-D319-40AA-AC2C-3994379C8515',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '5fdf99a6-0693-498d-adf9-2eb401059796',
        '7380c392-c879-4e16-a6dc-4c6b1aba9c11'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '5fdf99a6-0693-498d-adf9-2eb401059796',
        'f4a20b48-57e0-4259-b3ea-524e69dfde4c'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '5fdf99a6-0693-498d-adf9-2eb401059796',
        '47f1f7d7-ac12-4a5c-8572-41ab375ab7b3'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '32fa140d-ff0e-467b-8b06-dec5e8bae6ff',
      '5fdf99a6-0693-498d-adf9-2eb401059796'
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
    'e929d0cb-3456-46a7-ba64-87b296995d44',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202402006',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'F1B55F96-EA9A-483D-B9B7-05F2A7B91525',
    '2024-02-06T15:06:16.320Z',
    '2024-02-06T15:06:16.320Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '12BEB917-FB29-4F2C-9E8E-EBB016C8551F',
    'um úthlutun á tollkvótum vegna innflutnings á hvalaafurðum og rjúpum.',
    '2024-02-28T05:12:42.163Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('e929d0cb-3456-46a7-ba64-87b296995d44','0B2A5522-8182-45DD-BEDB-CC382C13749E');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('e929d0cb-3456-46a7-ba64-87b296995d44','FA92A35E-2FA8-4719-8E58-A6BC012FED98');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('e929d0cb-3456-46a7-ba64-87b296995d44','65E0AD76-7436-4E1D-BAE6-668CDAE16092');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '426f5109-0717-4471-9702-056138527b83',
            'Lárus Njáll Tómasson',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a64bc4d7-ae28-475b-a7dd-761cddd61435',
            'Kristín Valdimarsdóttir',
            NULL,
            'Varaseðlabankastjóri',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8839b021-8dcd-43d9-9180-3c0cb989c657',
            'Lárus Andri Pétursson',
            NULL,
            NULL,
            'Þingmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '481ec13e-e4a3-4271-a36f-e133c28341e5',
            'Unnar Úlfarsson',
            NULL,
            'Sendiherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'f316469d-4ca1-4c19-b1f7-3bb43df55c49',
            'Valdimar Úlfar Magnússon',
            NULL,
            'Menningar- og viðskiptaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'f860ff26-269a-43f4-bbcd-a92da803d6e0',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2024-02-06T15:06:16.320Z',
      'Fangelsismálastofnun ríkisins',
      'F1B55F96-EA9A-483D-B9B7-05F2A7B91525',
      '426f5109-0717-4471-9702-056138527b83',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f860ff26-269a-43f4-bbcd-a92da803d6e0',
        '426f5109-0717-4471-9702-056138527b83'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f860ff26-269a-43f4-bbcd-a92da803d6e0',
        'a64bc4d7-ae28-475b-a7dd-761cddd61435'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f860ff26-269a-43f4-bbcd-a92da803d6e0',
        '8839b021-8dcd-43d9-9180-3c0cb989c657'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f860ff26-269a-43f4-bbcd-a92da803d6e0',
        '481ec13e-e4a3-4271-a36f-e133c28341e5'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f860ff26-269a-43f4-bbcd-a92da803d6e0',
        'f316469d-4ca1-4c19-b1f7-3bb43df55c49'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'e929d0cb-3456-46a7-ba64-87b296995d44',
      'f860ff26-269a-43f4-bbcd-a92da803d6e0'
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
    'f4ddd810-d6f0-4c48-924a-5f1f3aa59851',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202204027',
    '799722be-5530-439a-91dc-606e129b030d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'E9213769-5C97-4F31-8449-E007FDCD5B37',
    '2022-04-27T16:38:15.309Z',
    '2022-04-27T16:38:15.309Z',
    false,
    NULL,
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '3848DF98-956E-4209-9489-3F0E9A6F0A9F',
    'fyrir Sjálfseignarstofnunina Auðkúluheiði.',
    '2022-05-02T19:08:19.131Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('f4ddd810-d6f0-4c48-924a-5f1f3aa59851','0E74EB7E-25FA-4A8D-8CDB-C4F1B17B3CE7');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('f4ddd810-d6f0-4c48-924a-5f1f3aa59851','5BA182DF-0D34-4DD3-99CD-9F98783371A7');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('f4ddd810-d6f0-4c48-924a-5f1f3aa59851','6E96431D-FCB8-45AE-B022-0B04241FA79E');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('f4ddd810-d6f0-4c48-924a-5f1f3aa59851','6ADC7C68-5ADA-49EE-BC3C-6C25A02CA748');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a184359f-68e7-4752-9c48-b3f456815ded',
            'Nína Oddný Davíðsdóttir',
            NULL,
            NULL,
            'Mennta- og barnamálaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '3117d763-df63-41df-bdaa-4cc5af696438',
            'Oddný Gunnarsdóttir',
            NULL,
            NULL,
            'Matvælaráðherra '
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'ad84982a-f43f-4790-8d27-3f1e241a2bde',
            'Ólafur Andri Gunnarsson',
            NULL,
            NULL,
            'Innviðaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'b3c6ef4e-b7a7-47f1-9afd-ef5bb3e344c8',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2022-04-27T16:38:15.309Z',
      'Gæða- og eftirlitsstofnun velferðamála',
      'E9213769-5C97-4F31-8449-E007FDCD5B37',
      'a184359f-68e7-4752-9c48-b3f456815ded',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b3c6ef4e-b7a7-47f1-9afd-ef5bb3e344c8',
        'a184359f-68e7-4752-9c48-b3f456815ded'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b3c6ef4e-b7a7-47f1-9afd-ef5bb3e344c8',
        '3117d763-df63-41df-bdaa-4cc5af696438'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b3c6ef4e-b7a7-47f1-9afd-ef5bb3e344c8',
        'ad84982a-f43f-4790-8d27-3f1e241a2bde'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'f4ddd810-d6f0-4c48-924a-5f1f3aa59851',
      'b3c6ef4e-b7a7-47f1-9afd-ef5bb3e344c8'
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
    'dacc9c63-2363-4349-b819-17b9399b6753',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202406015',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '485614BD-0C7A-486D-BA80-F634493C78B8',
    '2024-06-15T23:45:49.246Z',
    '2024-06-15T23:45:49.246Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '879E73B3-4134-4A4D-9D2D-95E1308FC671',
    'um hina íslensku fálkaorðu.',
    '2024-06-28T04:02:31.136Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('dacc9c63-2363-4349-b819-17b9399b6753','8D0A8F37-8551-4979-BC39-4E9874626BA5');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('dacc9c63-2363-4349-b819-17b9399b6753','0207C518-5B5B-46BD-8395-B20660B1E162');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('dacc9c63-2363-4349-b819-17b9399b6753','FAF531DB-9919-47D7-8431-7A645A5A6CED');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('dacc9c63-2363-4349-b819-17b9399b6753','F811A121-512D-4FA1-A7B2-58D1E69F6830');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'c519ab76-c581-4535-9c54-eb81dabeb467',
            'Ösp Valdimarsdóttir',
            NULL,
            'Heilbrigðisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '9b50873a-fd23-48bd-8981-5d0a2e6d25fe',
            'Þorsteinn Valdimar Björnsson',
            NULL,
            NULL,
            'Fjármála- og efnahagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '6670566f-05a0-42fc-a958-63c04912525d',
            'Jóhanna Davíðsdóttir',
            NULL,
            'Heilbrigðisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '92bd60f8-4e70-4040-9105-5e2e547f1c0c',
            'Gunnar Karlsson',
            NULL,
            NULL,
            'Sendiherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '3aeb0943-a38a-40fa-b7fb-4ac0d5976fa2',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-06-15T23:45:49.246Z',
      'Verkmenntaskóli Austurlands',
      '485614BD-0C7A-486D-BA80-F634493C78B8',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '3aeb0943-a38a-40fa-b7fb-4ac0d5976fa2',
        'c519ab76-c581-4535-9c54-eb81dabeb467'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '3aeb0943-a38a-40fa-b7fb-4ac0d5976fa2',
        '9b50873a-fd23-48bd-8981-5d0a2e6d25fe'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '3aeb0943-a38a-40fa-b7fb-4ac0d5976fa2',
        '6670566f-05a0-42fc-a958-63c04912525d'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '3aeb0943-a38a-40fa-b7fb-4ac0d5976fa2',
        '92bd60f8-4e70-4040-9105-5e2e547f1c0c'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'dacc9c63-2363-4349-b819-17b9399b6753',
      '3aeb0943-a38a-40fa-b7fb-4ac0d5976fa2'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a32b31be-14cd-4c50-8cc1-d419ec29602f',
            'Valdimar Hjaltason',
            NULL,
            NULL,
            'Bankaráðsmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '9efdcf59-1bfb-4609-a630-5cc4ca496083',
            'Unnur Ragnarsdóttir',
            NULL,
            NULL,
            'Utanríkisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'dd7f318b-e846-445d-861b-fcc999677f33',
            'Andri Valdimar Pétursson',
            NULL,
            NULL,
            'Heilbrigðisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '722848fd-2554-4109-9fca-4b356c07f0f0',
            'Yngvi Valdimarsson',
            NULL,
            'Umhverfis-, orku og loftslagsráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '24b901c3-af18-47ca-9966-9aee870108a5',
            'Nína Margrét Ögmundardóttir',
            NULL,
            NULL,
            'Menningar- og viðskiptaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '447e57fb-e9ed-481e-9e90-d1de3224e666',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-06-15T23:45:49.246Z',
      'Ríkissáttasemjari',
      '485614BD-0C7A-486D-BA80-F634493C78B8',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '447e57fb-e9ed-481e-9e90-d1de3224e666',
        'a32b31be-14cd-4c50-8cc1-d419ec29602f'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '447e57fb-e9ed-481e-9e90-d1de3224e666',
        '9efdcf59-1bfb-4609-a630-5cc4ca496083'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '447e57fb-e9ed-481e-9e90-d1de3224e666',
        'dd7f318b-e846-445d-861b-fcc999677f33'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '447e57fb-e9ed-481e-9e90-d1de3224e666',
        '722848fd-2554-4109-9fca-4b356c07f0f0'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '447e57fb-e9ed-481e-9e90-d1de3224e666',
        '24b901c3-af18-47ca-9966-9aee870108a5'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'dacc9c63-2363-4349-b819-17b9399b6753',
      '447e57fb-e9ed-481e-9e90-d1de3224e666'
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
    '0cc54420-9953-4891-aaa7-71574978dfa3',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202203022',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '480853f2-a511-41b5-b663-df655741e77a',
    '2ACB0E3A-B7D2-42D5-B442-D6028036202D',
    '2022-03-22T23:40:34.727Z',
    '2022-03-22T23:40:34.727Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um Tollskóla ríkisins og ráðningu, setningu og skipun í störf við tollendurskoðun og tollgæslu.',
    '2022-04-21T08:48:14.694Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('0cc54420-9953-4891-aaa7-71574978dfa3','C45B5E00-C897-42C0-B44B-95D4D348E53A');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '65f9bad0-a623-4aea-854d-a4770c17d67b',
            'Elín Valdimarsdóttir',
            NULL,
            NULL,
            'Stjórnarmenn'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '5412dfaf-fa1e-4d07-affc-8fdcda97dbf9',
            'Margrét Unnarsdóttir',
            NULL,
            NULL,
            'Háskóla-, iðnaða- og nýsköpunarráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'b4c1e589-3193-4a41-91b9-4808b77b1c8a',
            'Tómas Pétur Björnsson',
            NULL,
            NULL,
            'Dómsmálaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '4a1c193c-9c46-4bd3-88c2-b2ee80a95664',
            'Unnar Pétur Unnarsson',
            NULL,
            NULL,
            'Mennta- og barnamálaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '924af423-e8d9-4544-9406-f4e95648f6b7',
            'Oddur Andrason',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'e56c6230-5081-4b67-a3db-cdfd43027f48',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2022-03-22T23:40:34.727Z',
      'Rannsóknarnefnd samgönguslysa',
      '2ACB0E3A-B7D2-42D5-B442-D6028036202D',
      '65f9bad0-a623-4aea-854d-a4770c17d67b',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e56c6230-5081-4b67-a3db-cdfd43027f48',
        '65f9bad0-a623-4aea-854d-a4770c17d67b'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e56c6230-5081-4b67-a3db-cdfd43027f48',
        '5412dfaf-fa1e-4d07-affc-8fdcda97dbf9'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e56c6230-5081-4b67-a3db-cdfd43027f48',
        'b4c1e589-3193-4a41-91b9-4808b77b1c8a'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e56c6230-5081-4b67-a3db-cdfd43027f48',
        '4a1c193c-9c46-4bd3-88c2-b2ee80a95664'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e56c6230-5081-4b67-a3db-cdfd43027f48',
        '924af423-e8d9-4544-9406-f4e95648f6b7'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '0cc54420-9953-4891-aaa7-71574978dfa3',
      'e56c6230-5081-4b67-a3db-cdfd43027f48'
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
    '8433877c-8930-44c7-956b-c23bca316dbb',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202405017',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '79953062-3269-4E77-82BE-10EA0356D181',
    '2024-05-17T03:06:26.502Z',
    '2024-05-17T03:06:26.502Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    'DE86BA50-608B-4781-A151-CCB60B5F3B47',
    'um greiðslur til foreldra langveikra eða alvarlega fatlaðra barna.',
    '2024-05-28T19:04:24.203Z',
    NULL
  );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'f8ba0c86-39f4-46f5-b8e0-56c78c28fc92',
            'Úlfar Ýmir Andrason',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'cbff5af1-37c7-484f-8ecf-dba029c9b2af',
            'Fanney Íris Yngvadóttir',
            NULL,
            NULL,
            'Fjármála- og efnahagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e13ac7bd-ba48-46d6-8591-65749de7e4c8',
            'Ýr Hjaltadóttir',
            NULL,
            NULL,
            'Dómari'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'c43bb582-73a6-4ffe-8aad-7ba7947fff24',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-05-17T03:06:26.502Z',
      'Heilbrigðisstofnun Vestfjarða',
      '79953062-3269-4E77-82BE-10EA0356D181',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'c43bb582-73a6-4ffe-8aad-7ba7947fff24',
        'f8ba0c86-39f4-46f5-b8e0-56c78c28fc92'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'c43bb582-73a6-4ffe-8aad-7ba7947fff24',
        'cbff5af1-37c7-484f-8ecf-dba029c9b2af'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'c43bb582-73a6-4ffe-8aad-7ba7947fff24',
        'e13ac7bd-ba48-46d6-8591-65749de7e4c8'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '8433877c-8930-44c7-956b-c23bca316dbb',
      'c43bb582-73a6-4ffe-8aad-7ba7947fff24'
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
    '70c95fdf-2865-45e1-83ad-09b33b53da26',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202208024',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '27921FDE-6750-4322-B87D-25DEC1094B01',
    '2022-08-24T06:44:16.387Z',
    '2022-08-24T06:44:16.387Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '96E93299-F53E-49AF-A0DC-E43A2BD76488',
    'vegna hundahalds í Blönduóssbæ.',
    '2022-08-26T07:55:31.425Z',
    NULL
  );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8a44d439-be83-48c4-bb1e-43c1bacce243',
            'Úlfhildur Íris Björnsdóttir',
            NULL,
            'Háskóla-, iðnaða- og nýsköpunarráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '50811238-6f30-4288-ad2b-5da2ad1445f8',
            'Stefán Tómas Yngvason',
            NULL,
            NULL,
            'Sendiherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'e8081aa8-a8c5-4adf-bdbd-d8acf3479aab',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2022-08-24T06:44:16.387Z',
      'Bankasýsla ríkisins',
      '27921FDE-6750-4322-B87D-25DEC1094B01',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e8081aa8-a8c5-4adf-bdbd-d8acf3479aab',
        '8a44d439-be83-48c4-bb1e-43c1bacce243'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e8081aa8-a8c5-4adf-bdbd-d8acf3479aab',
        '50811238-6f30-4288-ad2b-5da2ad1445f8'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '70c95fdf-2865-45e1-83ad-09b33b53da26',
      'e8081aa8-a8c5-4adf-bdbd-d8acf3479aab'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'dcbca5fb-c458-4b59-b352-1154e2eb46e2',
            'Karl Davíðsson',
            NULL,
            NULL,
            'Utanríkisráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '2824e08c-1821-40d1-bab3-df8cdc12e6e0',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2022-08-24T06:44:16.387Z',
      'Ráðgjafar- og greiningarstöð',
      '27921FDE-6750-4322-B87D-25DEC1094B01',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2824e08c-1821-40d1-bab3-df8cdc12e6e0',
        'dcbca5fb-c458-4b59-b352-1154e2eb46e2'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '70c95fdf-2865-45e1-83ad-09b33b53da26',
      '2824e08c-1821-40d1-bab3-df8cdc12e6e0'
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
    'fa8c8ae0-8964-439c-9ed4-342a3eca0c5e',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202404009',
    '799722be-5530-439a-91dc-606e129b030d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'D27889F0-BD14-4766-ADC8-721AEED7B87D',
    '2024-04-09T21:25:59.440Z',
    '2024-04-09T21:25:59.440Z',
    false,
    NULL,
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '55EC9DA9-F2C6-4C36-8F69-84E794B530CD',
    'fyrir sorphirðu í Mosfellsbæ.',
    '2024-05-09T05:17:23.733Z',
    NULL
  );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '0579a582-d45c-40cf-b29d-a04fb0adb9e9',
            'Fanney Ýr Njálsdóttir',
            NULL,
            'Þingmaður',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7cf3349b-2673-44c2-b0c9-28a0d5612db9',
            'Tómas Davíð Björnsson',
            NULL,
            'Aðstoðarframkvæmdarstjóri',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'c59c798b-c534-4cdf-8a70-0c1c6d0345a7',
            'Anna Perla Úlfarsdóttir',
            NULL,
            'Varaseðlabankastjóri',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'c761d16f-82c0-4df6-bcda-1e6f84822869',
            'Ýmir Björnsson',
            NULL,
            'Forsætisráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '7a49d993-d82c-426e-aee6-b52cde0f2293',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2024-04-09T21:25:59.440Z',
      'Vatnajökulsþjóðgarður',
      'D27889F0-BD14-4766-ADC8-721AEED7B87D',
      '0579a582-d45c-40cf-b29d-a04fb0adb9e9',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '7a49d993-d82c-426e-aee6-b52cde0f2293',
        '0579a582-d45c-40cf-b29d-a04fb0adb9e9'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '7a49d993-d82c-426e-aee6-b52cde0f2293',
        '7cf3349b-2673-44c2-b0c9-28a0d5612db9'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '7a49d993-d82c-426e-aee6-b52cde0f2293',
        'c59c798b-c534-4cdf-8a70-0c1c6d0345a7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '7a49d993-d82c-426e-aee6-b52cde0f2293',
        'c761d16f-82c0-4df6-bcda-1e6f84822869'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'fa8c8ae0-8964-439c-9ed4-342a3eca0c5e',
      '7a49d993-d82c-426e-aee6-b52cde0f2293'
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
    '7485de9f-e905-4439-8a7a-7ce67784075b',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202207002',
    '799722be-5530-439a-91dc-606e129b030d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'CC5780A4-A70D-4B5B-965E-8DAA0BF2F64B',
    '2022-07-02T21:35:28.464Z',
    '2022-07-02T21:35:28.464Z',
    false,
    NULL,
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '28B320E4-52B9-4DE9-AB4A-CB8738DE613A',
    'um skipulagsmál í Sveitarfélaginu Árborg.',
    '2022-07-29T13:03:02.988Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('7485de9f-e905-4439-8a7a-7ce67784075b','F9A224A1-0B0F-4D52-9028-1D1AADBDCC61');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('7485de9f-e905-4439-8a7a-7ce67784075b','D4157B78-DC8B-4AC0-B2D3-BD5107592492');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e9de80de-779e-477e-ae88-86b168b2cbfa',
            'Sigríður Jóhanna Lárusdóttir',
            NULL,
            'Þingmaður',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8dc08885-c914-41a8-be59-d25aa34d10af',
            'Ýmir Hjalti Yngvason',
            NULL,
            'Heilbrigðisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '30d20f30-633e-4d95-aec5-736428f2f477',
            'Dagmar Gunnarsdóttir',
            NULL,
            NULL,
            'Heilbrigðisráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'f7ef2260-251c-4436-83f3-451b35b4be79',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2022-07-02T21:35:28.464Z',
      'Ferðamálastofa',
      'CC5780A4-A70D-4B5B-965E-8DAA0BF2F64B',
      'e9de80de-779e-477e-ae88-86b168b2cbfa',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f7ef2260-251c-4436-83f3-451b35b4be79',
        'e9de80de-779e-477e-ae88-86b168b2cbfa'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f7ef2260-251c-4436-83f3-451b35b4be79',
        '8dc08885-c914-41a8-be59-d25aa34d10af'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'f7ef2260-251c-4436-83f3-451b35b4be79',
        '30d20f30-633e-4d95-aec5-736428f2f477'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '7485de9f-e905-4439-8a7a-7ce67784075b',
      'f7ef2260-251c-4436-83f3-451b35b4be79'
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
    '993e0ab7-0eda-4f11-ad28-88b6b0c5c3de',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202407015',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '480853f2-a511-41b5-b663-df655741e77a',
    'E8D7CA59-6EB7-4848-9E46-962C023087B0',
    '2024-07-15T13:23:32.401Z',
    '2024-07-15T13:23:32.401Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    'A4D0615D-05FD-4BBB-AB6B-4C99EA9A5611',
    'um að skrá losun gróðurhúsalofttegunda.',
    '2024-07-30T23:37:15.051Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('993e0ab7-0eda-4f11-ad28-88b6b0c5c3de','157F3EB5-A544-40B4-9B28-A83E04BE3BB9');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '06901f36-dced-4934-ae25-eb25c3a27b84',
            'Ýmir Ólafur Björnsson',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '18a6cd55-b69a-4421-847e-42b845cb8e9c',
            'Karl Valdimarsson',
            NULL,
            NULL,
            'Fjármála- og efnahagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '95caa061-c197-4542-8a6e-34f512b2b7bb',
            'Pétur Valdimarsson',
            NULL,
            'Stjórnarmenn',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '389eda33-6d13-42bf-ba4b-8159567b9e1c',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-07-15T13:23:32.401Z',
      'Landhelgisgæsla Íslands',
      'E8D7CA59-6EB7-4848-9E46-962C023087B0',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '389eda33-6d13-42bf-ba4b-8159567b9e1c',
        '06901f36-dced-4934-ae25-eb25c3a27b84'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '389eda33-6d13-42bf-ba4b-8159567b9e1c',
        '18a6cd55-b69a-4421-847e-42b845cb8e9c'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '389eda33-6d13-42bf-ba4b-8159567b9e1c',
        '95caa061-c197-4542-8a6e-34f512b2b7bb'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '993e0ab7-0eda-4f11-ad28-88b6b0c5c3de',
      '389eda33-6d13-42bf-ba4b-8159567b9e1c'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a8aa9822-7ae8-47b2-9168-07271f2b11fd',
            'Valdimar Stefán Hjaltason',
            NULL,
            'Matvælaráðherra ',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '6ce82645-9dd4-4296-b102-7dcd72a6600c',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-07-15T13:23:32.401Z',
      'Sjúkrahúsið Akureyri',
      'E8D7CA59-6EB7-4848-9E46-962C023087B0',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6ce82645-9dd4-4296-b102-7dcd72a6600c',
        'a8aa9822-7ae8-47b2-9168-07271f2b11fd'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '993e0ab7-0eda-4f11-ad28-88b6b0c5c3de',
      '6ce82645-9dd4-4296-b102-7dcd72a6600c'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a7ce9392-8d9d-4037-96ec-c45d6918c462',
            'Þorsteinn Ingimarsson',
            NULL,
            'Fjármála- og efnahagsráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '33e85e28-f6a2-4ecd-aae0-7919a87fe52b',
            'Jón Unnarsson',
            NULL,
            'Mennta- og barnamálaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '7c86903d-d966-4356-bda9-48928e8e398f',
            'Ýr Ragnarsdóttir',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '6e3bc6f7-87c7-42e6-aeee-8ee8bba78b92',
            'Margrét Oddný Oddardóttir',
            NULL,
            NULL,
            'Stjórnarmenn'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '5c1108f8-f9b6-4f2d-b26e-ebeae6369f7f',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-07-15T13:23:32.401Z',
      'Lögreglustjórinn á Suðurnesjum',
      'E8D7CA59-6EB7-4848-9E46-962C023087B0',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '5c1108f8-f9b6-4f2d-b26e-ebeae6369f7f',
        'a7ce9392-8d9d-4037-96ec-c45d6918c462'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '5c1108f8-f9b6-4f2d-b26e-ebeae6369f7f',
        '33e85e28-f6a2-4ecd-aae0-7919a87fe52b'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '5c1108f8-f9b6-4f2d-b26e-ebeae6369f7f',
        '7c86903d-d966-4356-bda9-48928e8e398f'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '5c1108f8-f9b6-4f2d-b26e-ebeae6369f7f',
        '6e3bc6f7-87c7-42e6-aeee-8ee8bba78b92'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '993e0ab7-0eda-4f11-ad28-88b6b0c5c3de',
      '5c1108f8-f9b6-4f2d-b26e-ebeae6369f7f'
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
    'c397c73f-56da-4cc0-8dac-7e6d3dd588f2',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202209008',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '33E166EB-7BAD-42B7-ADCA-C2BFFDD62CAA',
    '2022-09-08T07:24:05.781Z',
    '2022-09-08T07:24:05.781Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    'DFF4D609-38C1-48C9-B516-E68F6D8E3833',
    'um breytingu á reglugerð nr. 267/1993 um notkun erlendra ökutækja.',
    '2022-09-16T16:00:07.267Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c397c73f-56da-4cc0-8dac-7e6d3dd588f2','F3BF88F6-A8A2-4202-BE1A-CA401F5183C2');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c397c73f-56da-4cc0-8dac-7e6d3dd588f2','FCCDA715-1F30-42D2-82B8-BFC7AD661186');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c397c73f-56da-4cc0-8dac-7e6d3dd588f2','752EADD5-1523-4983-A926-11AB62A83024');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c397c73f-56da-4cc0-8dac-7e6d3dd588f2','035B5C2E-B9D5-4E12-90FD-9E6141F420CF');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c397c73f-56da-4cc0-8dac-7e6d3dd588f2','27E60EF6-9002-4EC8-8EA2-020382B701D2');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e7937656-635e-4ac8-9658-fb72777c5f01',
            'Lilja Úlfarsdóttir',
            NULL,
            'Framkvæmdarstjóri',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'b403d124-25c7-4c2c-ab21-56e4bf83e5b4',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2022-09-08T07:24:05.781Z',
      'Umboðsmaður barna',
      '33E166EB-7BAD-42B7-ADCA-C2BFFDD62CAA',
      'e7937656-635e-4ac8-9658-fb72777c5f01',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b403d124-25c7-4c2c-ab21-56e4bf83e5b4',
        'e7937656-635e-4ac8-9658-fb72777c5f01'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'c397c73f-56da-4cc0-8dac-7e6d3dd588f2',
      'b403d124-25c7-4c2c-ab21-56e4bf83e5b4'
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
    '9f625314-0738-4d82-98fd-2b9aa1281cee',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202210027',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '046C4B3F-2717-4CFE-9EE2-5450274A5699',
    '2022-10-27T00:44:42.986Z',
    '2022-10-27T00:44:42.986Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    'B0CC838B-EC4B-4DFB-9937-20988DAADF06',
    'um breytingu á lögum nr. 6/2002, um tóbaksvarnir.',
    '2022-11-19T14:43:59.200Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9f625314-0738-4d82-98fd-2b9aa1281cee','12A61078-1F17-4EA2-AD69-5BB035F955ED');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9f625314-0738-4d82-98fd-2b9aa1281cee','9E955509-8B57-4497-9C1D-82C5B4DC2F6C');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9f625314-0738-4d82-98fd-2b9aa1281cee','1F1A78C5-E2D8-4F22-8A7C-16F35F7982AD');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9f625314-0738-4d82-98fd-2b9aa1281cee','AE85D270-F6A4-4A0E-B6DE-872868164771');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('9f625314-0738-4d82-98fd-2b9aa1281cee','4693D5F8-ACA9-470E-94B4-126807FB683B');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '26bd8134-75e7-4b6f-834e-6961a73ffc25',
            'Þorsteinn Björn Davíðsson',
            NULL,
            'Háskóla-, iðnaða- og nýsköpunarráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'd891315f-602a-4c13-91a3-19c178946e51',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2022-10-27T00:44:42.986Z',
      'Skipulagsstofnun',
      '046C4B3F-2717-4CFE-9EE2-5450274A5699',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd891315f-602a-4c13-91a3-19c178946e51',
        '26bd8134-75e7-4b6f-834e-6961a73ffc25'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '9f625314-0738-4d82-98fd-2b9aa1281cee',
      'd891315f-602a-4c13-91a3-19c178946e51'
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
    '63f86bfb-b701-481b-8d45-20a36660975b',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202312028',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '3E8AC32C-8300-44E5-B316-ACE7F08E6E6C',
    '2023-12-28T04:27:36.104Z',
    '2023-12-28T04:27:36.104Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um deiliskipulag í Bláskógabyggð.',
    '2023-12-28T17:41:32.987Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('63f86bfb-b701-481b-8d45-20a36660975b','CCE02FFA-346E-4237-BAFC-4FBBE53E078C');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('63f86bfb-b701-481b-8d45-20a36660975b','24C0ABE3-13DC-4247-9BE6-EDD56FCCA6A5');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'aa0031ff-410d-4436-aae9-853e7ff30810',
            'Fanney Davíðsdóttir',
            NULL,
            NULL,
            'Þingmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '363c2860-f9d0-4256-b467-17a88e8e2118',
            'Valgerður Karlsdóttir',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '36dc59c4-949c-43fb-bacd-e8fdf8349d13',
            'Kristín Unnur Yngvadóttir',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '2276e6d9-34e9-4e9e-9218-364d329b1b23',
            'Úlfhildur Unnarsdóttir',
            NULL,
            NULL,
            'Innviðaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'b994d95a-5732-4deb-a72d-81683f3a41c1',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-12-28T04:27:36.104Z',
      'Fjarskiptastofa',
      '3E8AC32C-8300-44E5-B316-ACE7F08E6E6C',
      'aa0031ff-410d-4436-aae9-853e7ff30810',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b994d95a-5732-4deb-a72d-81683f3a41c1',
        'aa0031ff-410d-4436-aae9-853e7ff30810'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b994d95a-5732-4deb-a72d-81683f3a41c1',
        '363c2860-f9d0-4256-b467-17a88e8e2118'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b994d95a-5732-4deb-a72d-81683f3a41c1',
        '36dc59c4-949c-43fb-bacd-e8fdf8349d13'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'b994d95a-5732-4deb-a72d-81683f3a41c1',
        '2276e6d9-34e9-4e9e-9218-364d329b1b23'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '63f86bfb-b701-481b-8d45-20a36660975b',
      'b994d95a-5732-4deb-a72d-81683f3a41c1'
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
    'ded1a320-b147-44c8-8dbc-c0660ed451f5',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202307008',
    '799722be-5530-439a-91dc-606e129b030d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'CBDE6D61-9918-4FCD-9756-393E67BC8F97',
    '2023-07-08T07:58:53.675Z',
    '2023-07-08T07:58:53.675Z',
    true,
    NULL,
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '5B8F4827-D885-4B3A-AF3D-5F1EAE9C23B8',
    'um deiliskipulag Dyrhólaeyjar, Mýrdalshreppi.',
    '2023-07-21T09:40:07.690Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('ded1a320-b147-44c8-8dbc-c0660ed451f5','52251249-FE5E-4CEB-9E4A-0310343323CE');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('ded1a320-b147-44c8-8dbc-c0660ed451f5','9E7B69EE-79DC-4DF3-9246-C615766C1BBC');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '2bc370f0-a8c2-4093-96dc-1e85649cd871',
            'Valgerður Lárusdóttir',
            NULL,
            'Heilbrigðisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '00767908-352d-4930-b5ef-ed68dd449cbe',
            'Karl Ingimar Tómasson',
            NULL,
            NULL,
            'Framkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'e7bfa8ff-f1ad-4642-bd32-d7f3b937d06a',
            'Ásta Nína Þorsteinsdóttir',
            NULL,
            NULL,
            'Dómari'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'a5c0eb89-1440-4159-8b01-c0e2b3e09465',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-07-08T07:58:53.675Z',
      'Borgarholtsskóli',
      'CBDE6D61-9918-4FCD-9756-393E67BC8F97',
      '2bc370f0-a8c2-4093-96dc-1e85649cd871',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a5c0eb89-1440-4159-8b01-c0e2b3e09465',
        '2bc370f0-a8c2-4093-96dc-1e85649cd871'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a5c0eb89-1440-4159-8b01-c0e2b3e09465',
        '00767908-352d-4930-b5ef-ed68dd449cbe'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'a5c0eb89-1440-4159-8b01-c0e2b3e09465',
        'e7bfa8ff-f1ad-4642-bd32-d7f3b937d06a'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'ded1a320-b147-44c8-8dbc-c0660ed451f5',
      'a5c0eb89-1440-4159-8b01-c0e2b3e09465'
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
    '402f792a-9f6c-40c8-9c36-38e8673e6b72',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202401017',
    '799722be-5530-439a-91dc-606e129b030d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '195ECCDC-BAF3-4CEC-97AC-EF1C5161B091',
    '2024-01-17T17:09:44.398Z',
    '2024-01-17T17:09:44.398Z',
    false,
    NULL,
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'fyrir sorphirðu í Grímsnes- og Grafningshreppi 2006.',
    '2024-02-01T20:11:41.483Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('402f792a-9f6c-40c8-9c36-38e8673e6b72','4B9417D5-C01B-436B-87ED-0FC135CC4421');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('402f792a-9f6c-40c8-9c36-38e8673e6b72','3DC2EF5D-7DB0-4054-BAC8-F718950594E0');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('402f792a-9f6c-40c8-9c36-38e8673e6b72','0B4DFF2E-480F-4DBB-B6C2-A9BA514AF681');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('402f792a-9f6c-40c8-9c36-38e8673e6b72','9739485C-B88B-4FB6-8CBA-7F742D15DF23');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('402f792a-9f6c-40c8-9c36-38e8673e6b72','87CCEE04-3530-4284-AA50-D34160ABD378');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a2f1a1af-a3b9-4947-a303-a6930af39d62',
            'Hjalti Davíð Finnsson',
            NULL,
            'Varaseðlabankastjóri',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'c071e57e-0a65-41bf-bc21-27c6786ce249',
            'Þorsteinn Tómasson',
            NULL,
            'Utanríkisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '98247e61-17d2-431e-97ca-5d6e17eace3f',
            'Einar Ingimarsson',
            NULL,
            NULL,
            'Umhverfis-, orku og loftslagsráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '9351ee3a-08ea-4386-be4a-e901b004a0a4',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-01-17T17:09:44.398Z',
      'Héraðsdómur Reykjavíkur',
      '195ECCDC-BAF3-4CEC-97AC-EF1C5161B091',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '9351ee3a-08ea-4386-be4a-e901b004a0a4',
        'a2f1a1af-a3b9-4947-a303-a6930af39d62'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '9351ee3a-08ea-4386-be4a-e901b004a0a4',
        'c071e57e-0a65-41bf-bc21-27c6786ce249'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '9351ee3a-08ea-4386-be4a-e901b004a0a4',
        '98247e61-17d2-431e-97ca-5d6e17eace3f'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '402f792a-9f6c-40c8-9c36-38e8673e6b72',
      '9351ee3a-08ea-4386-be4a-e901b004a0a4'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'b557b613-35a0-4413-9e06-3d383302d48e',
            'Einar Karlsson',
            NULL,
            NULL,
            'Sendiherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'eb608fdf-b43f-43fb-a042-4ed8628293a9',
            'Ýmir Valdimar Björnsson',
            NULL,
            'Mennta- og barnamálaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '997266e2-9845-4e02-8831-782a793a50b4',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-01-17T17:09:44.398Z',
      'Ferðamálastofa',
      '195ECCDC-BAF3-4CEC-97AC-EF1C5161B091',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '997266e2-9845-4e02-8831-782a793a50b4',
        'b557b613-35a0-4413-9e06-3d383302d48e'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '997266e2-9845-4e02-8831-782a793a50b4',
        'eb608fdf-b43f-43fb-a042-4ed8628293a9'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '402f792a-9f6c-40c8-9c36-38e8673e6b72',
      '997266e2-9845-4e02-8831-782a793a50b4'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '2ddd7372-19d6-4f16-aaf9-32e200d2089b',
            'Magnús Björnsson',
            NULL,
            NULL,
            'Stjórnarmenn'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '213587fd-9d93-4478-a2ec-5fc8d41da150',
            'Björn Njáll Pétursson',
            NULL,
            NULL,
            'Sendiherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '2d378cae-765f-4cbc-8e9a-75e6930e98cb',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-01-17T17:09:44.398Z',
      'Seðlabanki Íslands (C-hluta stofnun)',
      '195ECCDC-BAF3-4CEC-97AC-EF1C5161B091',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2d378cae-765f-4cbc-8e9a-75e6930e98cb',
        '2ddd7372-19d6-4f16-aaf9-32e200d2089b'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '2d378cae-765f-4cbc-8e9a-75e6930e98cb',
        '213587fd-9d93-4478-a2ec-5fc8d41da150'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '402f792a-9f6c-40c8-9c36-38e8673e6b72',
      '2d378cae-765f-4cbc-8e9a-75e6930e98cb'
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
    '92c7bb18-cfa9-4177-b771-6bf0cd1a0f73',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202301018',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '480853f2-a511-41b5-b663-df655741e77a',
    'B5B8B7DC-6FBE-45B2-928F-73093BC49310',
    '2023-01-18T01:15:21.882Z',
    '2023-01-18T01:15:21.882Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    'a6bada6d-ed10-4530-8d42-064c0aca506c',
    'um deiliskipulag frístundabyggðar í landi Staðarbakka í Fljótshlíð, Rangárþingi eystra.',
    '2023-02-10T11:19:15.761Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('92c7bb18-cfa9-4177-b771-6bf0cd1a0f73','6948B3AF-D876-43CB-BED0-765D12A9D882');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('92c7bb18-cfa9-4177-b771-6bf0cd1a0f73','B068BFF2-258D-4628-BE3F-F2580BC7C9FC');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('92c7bb18-cfa9-4177-b771-6bf0cd1a0f73','FEFE88B4-16AD-4E7F-95DF-63C0C491A639');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'bfc37ef7-5c37-429d-a80d-191e1ab65a7d',
            'Margrét Unnarsdóttir',
            NULL,
            'Forsætisráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '6127a3d8-b499-4b41-ad21-e007ef58b1dd',
            'Helga Yngvadóttir',
            NULL,
            NULL,
            'Dómsmálaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'aaebb3dd-c087-4a48-a8ac-0ed8f90eea5c',
            'Lárus Tómasson',
            NULL,
            NULL,
            'Háskóla-, iðnaða- og nýsköpunarráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '0557a04e-75a6-42a1-b061-621c47b55074',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-01-18T01:15:21.882Z',
      'Hæstiréttur Íslands',
      'B5B8B7DC-6FBE-45B2-928F-73093BC49310',
      'bfc37ef7-5c37-429d-a80d-191e1ab65a7d',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '0557a04e-75a6-42a1-b061-621c47b55074',
        'bfc37ef7-5c37-429d-a80d-191e1ab65a7d'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '0557a04e-75a6-42a1-b061-621c47b55074',
        '6127a3d8-b499-4b41-ad21-e007ef58b1dd'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '0557a04e-75a6-42a1-b061-621c47b55074',
        'aaebb3dd-c087-4a48-a8ac-0ed8f90eea5c'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '92c7bb18-cfa9-4177-b771-6bf0cd1a0f73',
      '0557a04e-75a6-42a1-b061-621c47b55074'
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
    '5030ce76-9884-4883-a73e-8598a218faf8',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202304004',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '480853f2-a511-41b5-b663-df655741e77a',
    '6CCEF935-9C16-4162-83E1-2D1C9A2E7C58',
    '2023-04-04T08:53:10.093Z',
    '2023-04-04T08:53:10.093Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '69CD3E90-106E-4B9C-8419-148C29E1738A',
    '8A955490-4FF6-4B04-96AC-F44CC35C42F6',
    'fyrir sorphirðu í Reykjavík.',
    '2023-04-15T06:02:34.563Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('5030ce76-9884-4883-a73e-8598a218faf8','E6535CAE-F4CA-4607-B767-40A63F154FFC');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '82ad87c2-9fb5-43e5-a2c2-9c5bf5b9e43d',
            'Ólöf Einarsdóttir',
            NULL,
            'Dómari',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '490a2e08-8c6e-4840-9e3d-aae8dda89b39',
            'Njáll Yngvason',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'd422c1fd-2519-4f66-b7c1-827766da920c',
            'Bryndís Ragnarsdóttir',
            NULL,
            'Sendiherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'aa41d02c-5119-4bff-a8e4-2d30a4f36418',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-04-04T08:53:10.093Z',
      'Lögreglustjórinn á Austurlandi',
      '6CCEF935-9C16-4162-83E1-2D1C9A2E7C58',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'aa41d02c-5119-4bff-a8e4-2d30a4f36418',
        '82ad87c2-9fb5-43e5-a2c2-9c5bf5b9e43d'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'aa41d02c-5119-4bff-a8e4-2d30a4f36418',
        '490a2e08-8c6e-4840-9e3d-aae8dda89b39'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'aa41d02c-5119-4bff-a8e4-2d30a4f36418',
        'd422c1fd-2519-4f66-b7c1-827766da920c'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '5030ce76-9884-4883-a73e-8598a218faf8',
      'aa41d02c-5119-4bff-a8e4-2d30a4f36418'
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
    '06609c82-21fa-4636-840a-46554909ae0c',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202208012',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '2D829553-9AB6-4586-8D7A-481789CA25E4',
    '2022-08-12T08:12:33.071Z',
    '2022-08-12T08:12:33.071Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um deiliskipulag og deiliskipulagsbreytingar í Grímsnes- og Grafningshreppi.',
    '2022-08-20T21:09:27.937Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('06609c82-21fa-4636-840a-46554909ae0c','65E0AD76-7436-4E1D-BAE6-668CDAE16092');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('06609c82-21fa-4636-840a-46554909ae0c','551185DF-5517-4586-9C74-F3B981436BEE');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('06609c82-21fa-4636-840a-46554909ae0c','FEFE88B4-16AD-4E7F-95DF-63C0C491A639');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'b2bcfef8-9c42-4adc-82da-d9b8fc9c03b0',
            'Ásta Ragnheiður Ólafsdóttir',
            NULL,
            'Menningar- og viðskiptaráðherra',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '8906cb36-01e7-407f-9cc1-32ab2d5f5ee8',
            'Ösp Ásta Ólafsdóttir',
            NULL,
            NULL,
            'Innviðaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '0cdbd64c-e8b0-4a33-8c05-73a12098425b',
            'Oddný Elín Karlsdóttir',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '221dc65f-448c-4772-b98f-f13e76e6372b',
            'Lárus Einar Björnsson',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'c86d530c-973b-47e0-9ab0-c4ebbf13d5ac',
            'Tanja Perla Gunnarsdóttir',
            NULL,
            'Dómsmálaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '4c16d159-12e6-4602-a437-bb8ba6b8d61c',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2022-08-12T08:12:33.071Z',
      'Húsnæðis- og mannvirkjastofnun',
      '2D829553-9AB6-4586-8D7A-481789CA25E4',
      'b2bcfef8-9c42-4adc-82da-d9b8fc9c03b0',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '4c16d159-12e6-4602-a437-bb8ba6b8d61c',
        'b2bcfef8-9c42-4adc-82da-d9b8fc9c03b0'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '4c16d159-12e6-4602-a437-bb8ba6b8d61c',
        '8906cb36-01e7-407f-9cc1-32ab2d5f5ee8'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '4c16d159-12e6-4602-a437-bb8ba6b8d61c',
        '0cdbd64c-e8b0-4a33-8c05-73a12098425b'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '4c16d159-12e6-4602-a437-bb8ba6b8d61c',
        '221dc65f-448c-4772-b98f-f13e76e6372b'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '4c16d159-12e6-4602-a437-bb8ba6b8d61c',
        'c86d530c-973b-47e0-9ab0-c4ebbf13d5ac'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '06609c82-21fa-4636-840a-46554909ae0c',
      '4c16d159-12e6-4602-a437-bb8ba6b8d61c'
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
    '2553b5f8-3146-463d-9862-1ec0f742a8ae',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202401022',
    '799722be-5530-439a-91dc-606e129b030d',
    '480853f2-a511-41b5-b663-df655741e77a',
    'C571117D-B189-4E32-BEBE-B75B4E77E6E2',
    '2024-01-22T18:23:18.704Z',
    '2024-01-22T18:23:18.704Z',
    false,
    NULL,
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '8DC66FA2-6516-4496-A48D-C0435BBB05F3',
    'um umferð í Reykjavík.',
    '2024-01-31T14:31:49.866Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2553b5f8-3146-463d-9862-1ec0f742a8ae','C0B16FE9-7119-43C8-9CBD-0CBDB379E9F5');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2553b5f8-3146-463d-9862-1ec0f742a8ae','08B7E516-48BD-4309-AC70-A51643178401');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2553b5f8-3146-463d-9862-1ec0f742a8ae','F9A224A1-0B0F-4D52-9028-1D1AADBDCC61');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('2553b5f8-3146-463d-9862-1ec0f742a8ae','0183E697-4A25-416E-8365-FBD43C75CC52');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'fa383ccc-33ab-4d72-b331-c68ad8c6f17b',
            'Lilja Dagmar Hjaltadóttir',
            NULL,
            NULL,
            'Dómari'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '9fc937a7-f5f9-463f-b8ab-b343afc4b79c',
            'Ögmundur Björnsson',
            NULL,
            NULL,
            'Matvælaráðherra '
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '3b91b20e-c362-4fab-a48f-38fa8f5b8e4d',
            'Úlfhildur Yngvadóttir',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '6cfb96c0-3b66-4f60-9882-89815157c988',
            'Andri Unnar Ólafsson',
            NULL,
            NULL,
            'Háskóla-, iðnaða- og nýsköpunarráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'f4dd7bac-d52d-4042-b054-cfe84f7db9c9',
            'Ingimar Ögmundarson',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'd96d271b-c1e2-48f4-ba5b-5828dc894b15',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-01-22T18:23:18.704Z',
      'Héraðsdómur Suðurlands',
      'C571117D-B189-4E32-BEBE-B75B4E77E6E2',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd96d271b-c1e2-48f4-ba5b-5828dc894b15',
        'fa383ccc-33ab-4d72-b331-c68ad8c6f17b'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd96d271b-c1e2-48f4-ba5b-5828dc894b15',
        '9fc937a7-f5f9-463f-b8ab-b343afc4b79c'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd96d271b-c1e2-48f4-ba5b-5828dc894b15',
        '3b91b20e-c362-4fab-a48f-38fa8f5b8e4d'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd96d271b-c1e2-48f4-ba5b-5828dc894b15',
        '6cfb96c0-3b66-4f60-9882-89815157c988'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'd96d271b-c1e2-48f4-ba5b-5828dc894b15',
        'f4dd7bac-d52d-4042-b054-cfe84f7db9c9'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '2553b5f8-3146-463d-9862-1ec0f742a8ae',
      'd96d271b-c1e2-48f4-ba5b-5828dc894b15'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '6e6b5243-4f00-437c-b57f-17bf3db922c8',
            'Stefán Valdimarsson',
            NULL,
            NULL,
            'Dómsmálaráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '78816987-506d-4cbc-bead-37ef76c7fbef',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-01-22T18:23:18.704Z',
      'Ráðgjafar- og greiningarstöð',
      'C571117D-B189-4E32-BEBE-B75B4E77E6E2',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '78816987-506d-4cbc-bead-37ef76c7fbef',
        '6e6b5243-4f00-437c-b57f-17bf3db922c8'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '2553b5f8-3146-463d-9862-1ec0f742a8ae',
      '78816987-506d-4cbc-bead-37ef76c7fbef'
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
    'c366d2cd-1c01-417c-bc23-46804ea7dfca',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202307007',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '480853f2-a511-41b5-b663-df655741e77a',
    'E5A35CF9-DC87-4DA7-85A2-06EB5D43812F',
    '2023-07-07T23:26:44.456Z',
    '2023-07-07T23:26:44.456Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    '9B7492A3-AE8A-4A8E-BC3B-492CB33C96E9',
    'um staðfestingu á aðalskipulagi Hrunamannahrepps 2003-2015.',
    '2023-08-02T23:31:35.191Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c366d2cd-1c01-417c-bc23-46804ea7dfca','17C04CAB-FDBA-4B72-8D24-0F5F50C3E314');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c366d2cd-1c01-417c-bc23-46804ea7dfca','DE8AC9BA-DF73-4353-A353-0E7F2D843D36');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c366d2cd-1c01-417c-bc23-46804ea7dfca','5F99D4DC-A52F-4CF1-83B1-B618DBD74DB2');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c366d2cd-1c01-417c-bc23-46804ea7dfca','82A214D0-B663-4245-80C6-6656AAC1EA69');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c366d2cd-1c01-417c-bc23-46804ea7dfca','06F8E57D-10FB-474D-86F0-DC8DF94ACDAC');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '73f405f1-ed8c-45b0-ae68-db9fbb91a957',
            'Einar Njálsson',
            NULL,
            'Bankaráðsmaður',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '57319e7f-9b1a-40f0-95da-f021b23d7419',
            'Guðrún Ingibjörg Andradóttir',
            NULL,
            NULL,
            'Aðstoðarframkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'fb7d5bff-b9df-43de-8f8b-e97254830e7e',
            'Fanney Úlfhildur Lárusdóttir',
            NULL,
            NULL,
            'Varaseðlabankastjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '271846f6-fe99-4f5f-9ba5-4795de04a743',
            'Þórdís Perla Úlfarsdóttir',
            NULL,
            NULL,
            'Fjármála- og efnahagsráðherra'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '39bde4fb-4ad6-4b46-9bc9-874e57c904ea',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-07-07T23:26:44.456Z',
      'Lögreglustjórinn á höfuðborgarsvæðinu',
      'E5A35CF9-DC87-4DA7-85A2-06EB5D43812F',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '39bde4fb-4ad6-4b46-9bc9-874e57c904ea',
        '73f405f1-ed8c-45b0-ae68-db9fbb91a957'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '39bde4fb-4ad6-4b46-9bc9-874e57c904ea',
        '57319e7f-9b1a-40f0-95da-f021b23d7419'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '39bde4fb-4ad6-4b46-9bc9-874e57c904ea',
        'fb7d5bff-b9df-43de-8f8b-e97254830e7e'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '39bde4fb-4ad6-4b46-9bc9-874e57c904ea',
        '271846f6-fe99-4f5f-9ba5-4795de04a743'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'c366d2cd-1c01-417c-bc23-46804ea7dfca',
      '39bde4fb-4ad6-4b46-9bc9-874e57c904ea'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '9f6e3e81-e8a5-431e-a575-99f3105ccbbc',
            'Ögmundur Lárus Pétursson',
            NULL,
            'Matvælaráðherra ',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '74364020-7982-4d1f-839e-ab12e2b10815',
            'Kristín Lilja Úlfarsdóttir',
            NULL,
            NULL,
            'Forsætisráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '4d58d8e4-73ae-4f5b-9f4a-d2e497ccbcbf',
            'Tanja Ingimarsdóttir',
            NULL,
            NULL,
            'Aðstoðarframkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '684b11ad-8c1e-440f-b552-ba85d1e540bc',
            'Ýmir Ólafur Njálsson',
            NULL,
            NULL,
            'Háskóla-, iðnaða- og nýsköpunarráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'ce86c072-d7b9-4803-93a2-245948d2256c',
            'Njáll Hjaltason',
            NULL,
            'Menningar- og viðskiptaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'e21d5f22-1b56-4c71-92e7-04aa5295ab48',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2023-07-07T23:26:44.456Z',
      'Hæstiréttur Íslands',
      'E5A35CF9-DC87-4DA7-85A2-06EB5D43812F',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e21d5f22-1b56-4c71-92e7-04aa5295ab48',
        '9f6e3e81-e8a5-431e-a575-99f3105ccbbc'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e21d5f22-1b56-4c71-92e7-04aa5295ab48',
        '74364020-7982-4d1f-839e-ab12e2b10815'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e21d5f22-1b56-4c71-92e7-04aa5295ab48',
        '4d58d8e4-73ae-4f5b-9f4a-d2e497ccbcbf'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e21d5f22-1b56-4c71-92e7-04aa5295ab48',
        '684b11ad-8c1e-440f-b552-ba85d1e540bc'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'e21d5f22-1b56-4c71-92e7-04aa5295ab48',
        'ce86c072-d7b9-4803-93a2-245948d2256c'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'c366d2cd-1c01-417c-bc23-46804ea7dfca',
      'e21d5f22-1b56-4c71-92e7-04aa5295ab48'
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
    'c8d543e8-b1c8-4481-8635-1cb2f253e77d',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202304015',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '685775AC-858C-4E36-BCDF-7ED340507656',
    '2023-04-15T00:57:15.644Z',
    '2023-04-15T00:57:15.644Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um breytingu á lögum um heimild fyrir ríkisstjórnina til þess að staðfesta fyrir Íslands hönd samþykkt um alþjóðareglur til að koma í veg fyrir árekstra á sjó, 1972, nr. 7/1975, með síðari breytingum.',
    '2023-04-18T02:12:05.661Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c8d543e8-b1c8-4481-8635-1cb2f253e77d','6CF7EADD-5CB2-425E-9777-517382B3E0E4');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('c8d543e8-b1c8-4481-8635-1cb2f253e77d','003E856E-F09B-411F-B404-B0EAE510AC6C');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '3a54abe4-7af5-4d3b-affd-048a95819868',
            'Jóhanna Ingibjörg Valdimarsdóttir',
            NULL,
            NULL,
            'Framkvæmdarstjóri'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '631452a7-4b0f-4024-98b0-0da32cbb369a',
            'Unnar Lárusson',
            NULL,
            NULL,
            'Bankaráðsmaður'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      'ea6ce057-ac3a-4d30-92c4-9190ad86c2ff',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2023-04-15T00:57:15.644Z',
      'Héraðsdómur Suðurlands',
      '685775AC-858C-4E36-BCDF-7ED340507656',
      '3a54abe4-7af5-4d3b-affd-048a95819868',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'ea6ce057-ac3a-4d30-92c4-9190ad86c2ff',
        '3a54abe4-7af5-4d3b-affd-048a95819868'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        'ea6ce057-ac3a-4d30-92c4-9190ad86c2ff',
        '631452a7-4b0f-4024-98b0-0da32cbb369a'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      'c8d543e8-b1c8-4481-8635-1cb2f253e77d',
      'ea6ce057-ac3a-4d30-92c4-9190ad86c2ff'
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
    '150a4c03-2bb5-4061-a2cd-e57d161bc90d',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202203012',
    '799722be-5530-439a-91dc-606e129b030d',
    '480853f2-a511-41b5-b663-df655741e77a',
    'C371B8B7-3108-4706-A24A-65695D82D662',
    '2022-03-12T00:53:42.597Z',
    '2022-03-12T00:53:42.597Z',
    true,
    NULL,
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um verndun kóralsvæða við suðurströndina.',
    '2022-03-20T15:09:58.668Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('150a4c03-2bb5-4061-a2cd-e57d161bc90d','5B632BD5-5941-4BA4-9204-E3B9DD35EDBE');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('150a4c03-2bb5-4061-a2cd-e57d161bc90d','18F22D4C-BD42-4047-A28D-3CE074AC62B0');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('150a4c03-2bb5-4061-a2cd-e57d161bc90d','D1623FE0-EB23-4686-A98A-A36EEB6F59AD');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('150a4c03-2bb5-4061-a2cd-e57d161bc90d','E6F40ABA-A3E0-4B14-99A0-AA8921813E22');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'f223a519-f20f-4f5d-be7a-d518ca86548f',
            'Oddur Ragnarsson',
            NULL,
            NULL,
            'Framkvæmdarstjóri'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '6164a520-2921-48b3-94ca-1da12667a704',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2022-03-12T00:53:42.597Z',
      'Vísindasiðanefnd',
      'C371B8B7-3108-4706-A24A-65695D82D662',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '6164a520-2921-48b3-94ca-1da12667a704',
        'f223a519-f20f-4f5d-be7a-d518ca86548f'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '150a4c03-2bb5-4061-a2cd-e57d161bc90d',
      '6164a520-2921-48b3-94ca-1da12667a704'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'daf7aa68-be4c-4a47-94d8-9761820209a7',
            'Perla Jóhanna Björnsdóttir',
            NULL,
            NULL,
            'Bankaráðsmaður'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '5753c711-cac2-45b5-b61d-83946a454858',
            'Lilja Ýr Jónsdóttir',
            NULL,
            NULL,
            'Fjármála- og efnahagsráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '417bfd7e-ea82-4a43-a596-729426308468',
            'Yngvi Unnar Finnsson',
            NULL,
            NULL,
            'Innviðaráðherra'
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '4fb9612f-7bba-418d-861a-9bd701298f04',
            'Lilja Hjaltadóttir',
            NULL,
            'Dómari',
            NULL
          );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '846bc448-e3f4-4e0a-a1a7-028b8803a7e2',
            'Magnús Hjaltason',
            NULL,
            'Heilbrigðisráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '427fad29-a619-4c89-a7ca-d59d66f31fe9',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2022-03-12T00:53:42.597Z',
      'Gljúfrasteinn: hús skáldsins',
      'C371B8B7-3108-4706-A24A-65695D82D662',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '427fad29-a619-4c89-a7ca-d59d66f31fe9',
        'daf7aa68-be4c-4a47-94d8-9761820209a7'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '427fad29-a619-4c89-a7ca-d59d66f31fe9',
        '5753c711-cac2-45b5-b61d-83946a454858'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '427fad29-a619-4c89-a7ca-d59d66f31fe9',
        '417bfd7e-ea82-4a43-a596-729426308468'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '427fad29-a619-4c89-a7ca-d59d66f31fe9',
        '4fb9612f-7bba-418d-861a-9bd701298f04'
      );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '427fad29-a619-4c89-a7ca-d59d66f31fe9',
        '846bc448-e3f4-4e0a-a1a7-028b8803a7e2'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '150a4c03-2bb5-4061-a2cd-e57d161bc90d',
      '427fad29-a619-4c89-a7ca-d59d66f31fe9'
    );

        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '13872e1e-9cfa-4399-8048-50a362c0c871',
            'Ylfa Einarsdóttir',
            NULL,
            NULL,
            'Dómari'
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '73396fab-3bc7-4d72-93ee-91f187daf18a',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2022-03-12T00:53:42.597Z',
      'Hljóðbókasafn Íslands',
      'C371B8B7-3108-4706-A24A-65695D82D662',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '73396fab-3bc7-4d72-93ee-91f187daf18a',
        '13872e1e-9cfa-4399-8048-50a362c0c871'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '150a4c03-2bb5-4061-a2cd-e57d161bc90d',
      '73396fab-3bc7-4d72-93ee-91f187daf18a'
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
    '75f4761c-9d13-4376-8ba1-4ecbc5bd5c26',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202401029',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '13C28327-434C-4D3D-9554-7820A4E28E80',
    '2024-01-29T17:52:20.919Z',
    '2024-01-29T17:52:20.919Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '472AF28C-5F60-48B4-81F5-4BB4254DD74D',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um karfaveiðar fiskiskipa frá Evrópusambandinu í fiskveiðilandhelgi Íslands 2006.',
    '2024-02-18T12:27:00.782Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('75f4761c-9d13-4376-8ba1-4ecbc5bd5c26','C826BA71-A1D4-427F-A1A3-85D23C5140EE');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            '95d5dd55-0192-4db2-a1d3-cd0123ed7b35',
            'Ýmir Finnsson',
            NULL,
            'Menningar- og viðskiptaráðherra',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '9aeac9a6-a378-4fe7-b3ea-bc8a03a7a203',
      'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
      '2024-01-29T17:52:20.919Z',
      'Ríkislögreglustjóri',
      '13C28327-434C-4D3D-9554-7820A4E28E80',
      '95d5dd55-0192-4db2-a1d3-cd0123ed7b35',
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '9aeac9a6-a378-4fe7-b3ea-bc8a03a7a203',
        '95d5dd55-0192-4db2-a1d3-cd0123ed7b35'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '75f4761c-9d13-4376-8ba1-4ecbc5bd5c26',
      '9aeac9a6-a378-4fe7-b3ea-bc8a03a7a203'
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
    '959c1697-324e-41a7-bc46-aa39c8796b0a',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202401025',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'ABA4439C-5C62-46CA-9401-DCC4CDC9011C',
    '2024-01-25T18:18:18.002Z',
    '2024-01-25T18:18:18.002Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '637291F2-F7F4-405D-8586-EF88B59CAB00',
    'fbcd40ce-c6b3-4cfa-8b0d-67a875b1872b',
    'um innköllun þriggja seðlastærða.',
    '2024-02-09T04:52:44.297Z',
    NULL
  );
INSERT INTO case_categories(case_case_id,category_id) VALUES ('959c1697-324e-41a7-bc46-aa39c8796b0a','537C0DF2-B448-4E1A-BE42-EA9EC62BFDA2');
INSERT INTO case_categories(case_case_id,category_id) VALUES ('959c1697-324e-41a7-bc46-aa39c8796b0a','F512329C-7BC5-4875-92B2-B02419C3ABA7');
        INSERT INTO
          SIGNATURE_MEMBER (
            ID,
            VALUE,
            TEXT_ABOVE,
            TEXT_BELOW,
            TEXT_AFTER
          )
          VALUES (
            'a6a244d7-2b57-4ef0-91cf-3a46b46589f7',
            'Unnar Karl Ögmundarson',
            NULL,
            'Aðstoðarframkvæmdarstjóri',
            NULL
          );

  INSERT INTO
    SIGNATURE (
      ID,
      TYPE_ID,
      DATE,
      INSTITUTION,
      INVOLVED_PARTY_ID,
      CHAIRMAN_ID,
      ADDITIONAL_SIGNATURE,
      HTML
    )
    VALUES (
      '36d548ca-cda2-475f-9c58-aa5c45cd5fa9',
      '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
      '2024-01-25T18:18:18.002Z',
      'Lögreglustjórinn á höfuðborgarsvæðinu',
      'ABA4439C-5C62-46CA-9401-DCC4CDC9011C',
      NULL,
      NULL,
      '<div>Signature</div>'
    );

    INSERT INTO
      SIGNATURE_MEMBERS (
        SIGNATURE_ID,
        SIGNATURE_MEMBER_ID
      )
      VALUES (
        '36d548ca-cda2-475f-9c58-aa5c45cd5fa9',
        'a6a244d7-2b57-4ef0-91cf-3a46b46589f7'
      );

  INSERT INTO
    CASE_SIGNATURES (
      CASE_CASE_ID,
      SIGNATURE_ID
    )
    VALUES (
      '959c1697-324e-41a7-bc46-aa39c8796b0a',
      '36d548ca-cda2-475f-9c58-aa5c45cd5fa9'
    );
