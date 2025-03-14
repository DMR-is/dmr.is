INSERT INTO APPLICATION_FEE_CODES (FEE_CODE, DESCRIPTION, FEE_TYPE, VALUE) VALUES
  ('A101', 'Department A - Advert base fee', 'FIXED', 4000),
  ('A104', 'Attachment document', 'FIXED', 15000),
  ('A106', '% álags vegna mikillar vinnu við mál', 'PERCENTAGE', 0), -- Value?
  ('A107', '80% á upphæð vegna flýtibirtingar (innan 10 daga)', 'PERCENTAGE', 1.8),
  ('B101', 'Department B base - 1000 characters included', 'FIXED', 9000),
  ('B102', 'Fee for each character when characters exceed base (B101)', 'FIXED', 2),
  ('B104', 'Attachment document', 'FIXED', 15000),
  ('B106', '% álags vegna mikillar vinnu við mál', 'PERCENTAGE', 0), -- Value?
  ('B107', '80% á upphæð vegna flýtibirtingar (innan 10 daga)', 'PERCENTAGE', 1.8),
  ('B108', '1-5 myndir í máli, slegið inn', 'FIXED', 5000),
  ('B109', '6-15 myndir í máli, slegið inn', 'FIXED', 10000),
  ('B110', '>15 myndir í máli, slegið inn', 'FIXED', 15000),
  ('C101', 'Department C - Base fee', 'FIXED', 5000),
  ('C104', 'Lækkun vegna birtingar eldri mál', 'FIXED', 1500),
  ('C107', '80% á upphæð vegna flýtibirtingar (innan 10 daga)', 'PERCENTAGE', 1.8);
  