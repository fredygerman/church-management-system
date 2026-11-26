-- =============================================================================
-- DEV ONLY demo data for the member mobile app (Mito ya Baraka Church, Dar es Salaam)
--
-- NEVER run this against production. Target: the DEV database only.
--
-- What it seeds (INSERT ... ON CONFLICT (id) DO NOTHING, no existing row is changed):
--   - service types + upcoming services (Sunday x2 services, Wednesday, Friday), 8 weeks ahead
--   - 10 published events (Kongamano, Harambee, Semina ya Ndoa, Krismasi, Mkesha, ...)
--   - 8 announcements (completed campaigns shown on the home screen)
--   - 15 library resources (sermons, devotionals, Bible-study guides, choir lyrics)
--   - 10 inbox notifications for the test user (4 unread, 6 read)
--   - event RSVPs for the test member and some demo members
--   - 40 demo members in 8 families (staff/directory data; not shown by the member app)
--
-- Dates are relative to current_date, so upcoming services stay in the future.
-- Times are stored in UTC like the existing DEV events (9:00 EAT = 06:00 UTC).
-- Library items have placeholder storage keys (no real files). Opening one in the
-- app returns a signed URL that does not resolve to a file.
--
-- How to run (DEV only), from the repo root:
--   1. Validate first: copy this file, replace the final COMMIT; with ROLLBACK;
--      and run it with psql using ON_ERROR_STOP=1.
--   2. Run the real file the same way.
--   3. Clean up: run mobile-demo-data.cleanup.sql. It deletes only rows whose ids
--      match the aaaaaaaa-000N-... pattern used here.
--
-- Rerunning is safe: existing demo ids are skipped. Relative dates are fixed at the
-- first run. To refresh them, run the cleanup file first, then this seed.
-- =============================================================================

BEGIN;

-- Fixed ids used by this seed (DEV):
--   church          11111111-1111-4111-8111-111111111111  (Mito ya Baraka Church)
--   uploader/admin  22222222-2222-4222-8222-222222222222  (Demo Administrator)
--   test member     d31935be-db6a-40a3-b2d0-4ceb4e7f36d3  (Mobile Test)
--   test user       30a348f3-067c-4318-971e-a1ddef3c0d1a  (mobile.test@mitoyabarakachurch.org)

-- ---------------------------------------------------------------------------
-- 1. Service types (new Swahili service names; existing service types are untouched)
-- ---------------------------------------------------------------------------
INSERT INTO service_types (id, church_id, name, is_active) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Ibada ya Jumapili - 9:00 asubuhi', true),
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Ibada ya Jumapili - Huduma ya Pili', true),
  ('aaaaaaaa-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Maombi na Mafunzo', true),
  ('aaaaaaaa-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Ibada ya Vijana', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Services (attendance sessions) for the next 8 weeks.
--    Member app lists upcoming, non-draft sessions. Sundays: 2 services each.
--    Wednesday Maombi na Mafunzo and Friday Ibada ya Vijana for 4 weeks each.
-- ---------------------------------------------------------------------------
WITH anchors AS (
  SELECT
    (current_date + ((7 - extract(dow FROM current_date)::int) % 7))       AS sun,
    (current_date + ((3 - extract(dow FROM current_date)::int + 7) % 7))   AS wed,
    (current_date + ((5 - extract(dow FROM current_date)::int + 7) % 7))   AS fri
)
INSERT INTO service_sessions (id, church_id, service_type_id, title, session_date, status, qr_token, created_at, updated_at)
SELECT
  ('aaaaaaaa-0001-4000-8000-' || lpad(s.n::text, 12, '0'))::uuid,
  '11111111-1111-4111-8111-111111111111',
  s.service_type_id::uuid,
  s.title,
  s.session_date,
  'open',
  'mtd-demo-qr-' || lpad(s.n::text, 3, '0'),
  now(),
  now()
FROM (
  SELECT 100 + w * 2 + 1 AS n, 'aaaaaaaa-0000-4000-8000-000000000001' AS service_type_id, 'Ibada ya Jumapili - 9:00 asubuhi' AS title, (a.sun + 7 * w)::date AS session_date
    FROM anchors a, generate_series(0, 7) AS w
  UNION ALL
  SELECT 100 + w * 2 + 2, 'aaaaaaaa-0000-4000-8000-000000000002', 'Ibada ya Jumapili - Huduma ya Pili', (a.sun + 7 * w)::date
    FROM anchors a, generate_series(0, 7) AS w
  UNION ALL
  SELECT 200 + w, 'aaaaaaaa-0000-4000-8000-000000000003', 'Maombi na Mafunzo', (a.wed + 7 * w)::date
    FROM anchors a, generate_series(0, 3) AS w
  UNION ALL
  SELECT 300 + w, 'aaaaaaaa-0000-4000-8000-000000000004', 'Ibada ya Vijana', (a.fri + 7 * w)::date
    FROM anchors a, generate_series(0, 3) AS w
) AS s
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Demo members (40) and families (8). Members are inserted before families
--    because families.spouse_id references members.
-- ---------------------------------------------------------------------------
INSERT INTO members (id, church_id, first_name, last_name, phone, date_of_birth, gender, occupation, date_of_salvation, baptism_status, marital_status, family_id, notes) VALUES
  ('aaaaaaaa-0008-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Neema',    'Mwang''oka', '+255 700 000 001', '1988-03-14', 'female', 'Mwalimu wa Shule (Teacher)',               '2004-06-20', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000001', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Daudi',    'Mwang''oka', '+255 700 000 002', '1985-07-02', 'male',   'Mhandisi (Engineer)',                    '2003-09-12', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000001', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Kelvin',   'Mwang''oka', NULL,               '2012-05-20', 'male',   'Mwanafunzi (Student)',                   NULL,         'none',  'single',   'aaaaaaaa-0007-4000-8000-000000000001', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Anna',     'Mwang''oka', NULL,               '2015-09-11', 'female', 'Mwanafunzi (Student)',                   NULL,         'none',  'single',   'aaaaaaaa-0007-4000-8000-000000000001', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Baraka',   'Kileo',      '+255 700 000 005', '1981-01-25', 'male',   'Mfanyabiashara (Business owner)',        '2001-04-08', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000002', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Esther',   'Kileo',      '+255 700 000 006', '1984-10-30', 'female', 'Muuguzi (Nurse)',                        '2002-11-03', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000002', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'Zawadi',   'Kileo',      NULL,               '2008-02-17', 'female', 'Mwanafunzi (Student)',                   NULL,         'maji',  'single',   'aaaaaaaa-0007-4000-8000-000000000002', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'Emmanuel', 'Shayo',      '+255 700 000 008', '1977-12-09', 'male',   'Mhasibu (Accountant)',                   '1999-05-16', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000003', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'Happiness', 'Shayo',      '+255 700 000 009', '1980-04-21', 'female', 'Mjasiriamali (Small business)',            '2000-08-06', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000003', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', 'Lucy',     'Shayo',      NULL,               '2011-06-03', 'female', 'Mwanafunzi (Student)',                   NULL,         'none',  'single',   'aaaaaaaa-0007-4000-8000-000000000003', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', 'Godfrey',  'Mrema',      '+255 700 000 011', '1975-08-27', 'male',   'Dereva wa Malori (Truck driver)',        '1998-02-14', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000004', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111', 'Agnes',    'Mrema',      '+255 700 000 012', '1978-03-05', 'female', 'Mwalimu (Teacher)',                      '1998-02-14', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000004', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111', 'Rehema',   'Massawe',    '+255 700 000 013', '1970-11-18', 'female', 'Mfanyakazi wa Benki (Bank officer)',     '1995-03-26', 'both',  'widowed',  'aaaaaaaa-0007-4000-8000-000000000005', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000014', '11111111-1111-4111-8111-111111111111', 'Japhet',   'Massawe',    NULL,               '2009-01-14', 'male',   'Mwanafunzi (Student)',                   NULL,         'none',  'single',   'aaaaaaaa-0007-4000-8000-000000000005', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000015', '11111111-1111-4111-8111-111111111111', 'Miriam',   'Massawe',    NULL,               '2011-12-02', 'female', 'Mwanafunzi (Student)',                   NULL,         'none',  'single',   'aaaaaaaa-0007-4000-8000-000000000005', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000016', '11111111-1111-4111-8111-111111111111', 'Frank',    'Mtui',       '+255 700 000 016', '1983-06-12', 'male',   'Fundi Umeme (Electrician)',              '2005-10-01', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000006', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000017', '11111111-1111-4111-8111-111111111111', 'Zawadi',   'Mtui',       '+255 700 000 017', '1986-09-09', 'female', 'Mshona nguo (Tailor)',                    '2005-10-01', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000006', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000018', '11111111-1111-4111-8111-111111111111', 'Samwel',   'Lyimo',      '+255 700 000 018', '1972-05-30', 'male',   'Mkulima (Farmer)',                       '1996-07-07', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000007', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000019', '11111111-1111-4111-8111-111111111111', 'Joyce',    'Lyimo',      '+255 700 000 019', '1975-02-28', 'female', 'Mhudumu wa Afya (Health worker)',         '1996-07-07', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000007', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000020', '11111111-1111-4111-8111-111111111111', 'Daudi',    'Mollel',     '+255 700 000 020', '1990-10-10', 'male',   'Fundi Bomba (Plumber)',                  '2012-03-18', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000008', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000021', '11111111-1111-4111-8111-111111111111', 'Upendo',   'Mollel',     '+255 700 000 021', '1992-04-04', 'female', 'Mwalimu wa Muziki (Music teacher)',       '2012-03-18', 'both',  'married',  'aaaaaaaa-0007-4000-8000-000000000008', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000022', '11111111-1111-4111-8111-111111111111', 'Peter',    'Mollel',     NULL,               '2014-07-22', 'male',   'Mwanafunzi (Student)',                   NULL,         'none',  'single',   'aaaaaaaa-0007-4000-8000-000000000008', NULL),
  ('aaaaaaaa-0008-4000-8000-000000000023', '11111111-1111-4111-8111-111111111111', 'Upendo',   'Mushi',      '+255 700 000 023', '1996-01-08', 'female', 'Mhasibu Msaidizi (Accounts assistant)',   '2016-08-14', 'both',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000024', '11111111-1111-4111-8111-111111111111', 'Elias',    'Kimaro',     '+255 700 000 024', '1991-03-19', 'male',   'Mhandisi wa Ujenzi (Civil engineer)',    '2014-06-01', 'both',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000025', '11111111-1111-4111-8111-111111111111', 'Mariam',   'Mbwambo',    '+255 700 000 025', '1999-07-07', 'female', 'Mwanafunzi wa Chuo (University student)', '2017-02-19', 'both',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000026', '11111111-1111-4111-8111-111111111111', 'Victor',   'Swai',       '+255 700 000 026', '1994-11-11', 'male',   'Mwalimu wa Michezo (Sports teacher)',    '2010-09-05', 'both',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000027', '11111111-1111-4111-8111-111111111111', 'Glory',    'Minja',      '+255 700 000 027', '1987-05-16', 'female', 'Mtaalamu wa TEHAMA (IT specialist)',      '2008-12-12', 'both',  'married',  NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000028', '11111111-1111-4111-8111-111111111111', 'Hamisi',   'Kessy',      '+255 700 000 028', '1968-02-02', 'male',   'Mfanyabiashara wa maduka (Shop owner)',  '1990-06-30', 'both',  'married',  NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000029', '11111111-1111-4111-8111-111111111111', 'Pendo',    'Temba',      '+255 700 000 029', '2003-10-27', 'female', 'Mhasibu (Accounts clerk)',                 '2019-04-07', 'both',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000030', '11111111-1111-4111-8111-111111111111', 'Obed',     'Moshi',      '+255 700 000 030', '1998-04-15', 'male',   'Mtafiti wa Kilimo (Agronomist)',         '2015-11-22', 'both',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000031', '11111111-1111-4111-8111-111111111111', 'Sarafina', 'Lema',       '+255 700 000 031', '1962-09-20', 'female', 'Mstaafu (Retired)',                       '1992-03-08', 'both',  'widowed',  NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000032', '11111111-1111-4111-8111-111111111111', 'Gift',     'Chuwa',      NULL,               '2005-12-25', 'male',   'Mwanafunzi (Student)',                   NULL,         'none',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000033', '11111111-1111-4111-8111-111111111111', 'Michael',  'Mwakasege',  '+255 700 000 033', '1979-08-08', 'male',   'Afisa Ugavi (Logistics officer)',        '2002-10-13', 'both',  'married',  NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000034', '11111111-1111-4111-8111-111111111111', 'Faraja',   'Kavishe',    '+255 700 000 034', '1989-01-31', 'female', 'Muuguzi wa Zahanati (Clinic nurse)',      '2010-05-09', 'both',  'married',  NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000035', '11111111-1111-4111-8111-111111111111', 'Irene',    'Urio',       '+255 700 000 035', '1994-06-06', 'female', 'Mtangazaji wa redio (Radio presenter)',   '2013-04-28', 'both',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000036', '11111111-1111-4111-8111-111111111111', 'Benson',   'Sanga',      '+255 700 000 036', '1997-02-24', 'male',   'Mhudumu wa mapokezi (Receptionist)',     '2019-09-15', 'both',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000037', '11111111-1111-4111-8111-111111111111', 'Salome',   'Mmbaga',     '+255 700 000 037', '1983-12-12', 'female', 'Mfanyabiashara wa chakula (Food vendor)', '2004-03-21', 'both',  'married',  NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000038', '11111111-1111-4111-8111-111111111111', 'Charles',  'Ngowi',      '+255 700 000 038', '1974-10-16', 'male',   'Mkandarasi (Contractor)',                '1997-07-27', 'both',  'married',  NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000039', '11111111-1111-4111-8111-111111111111', 'Nuru',     'Kweka',      NULL,               '2006-03-03', 'female', 'Mwanafunzi (Student)',                   NULL,         'none',  'single',   NULL, NULL),
  ('aaaaaaaa-0008-4000-8000-000000000040', '11111111-1111-4111-8111-111111111111', 'Erasto',   'Mwasha',     '+255 700 000 040', '1969-06-23', 'male',   'Mchungaji Msaidizi (Assistant elder)',   '1993-01-10', 'both',  'married',  NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO families (id, church_id, family_name, spouse_id) VALUES
  ('aaaaaaaa-0007-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Familia ya Mwang''oka', 'aaaaaaaa-0008-4000-8000-000000000002'),
  ('aaaaaaaa-0007-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Familia ya Kileo',       'aaaaaaaa-0008-4000-8000-000000000005'),
  ('aaaaaaaa-0007-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Familia ya Shayo',       'aaaaaaaa-0008-4000-8000-000000000008'),
  ('aaaaaaaa-0007-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Familia ya Mrema',       'aaaaaaaa-0008-4000-8000-000000000011'),
  ('aaaaaaaa-0007-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Familia ya Massawe',     'aaaaaaaa-0008-4000-8000-000000000013'),
  ('aaaaaaaa-0007-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Familia ya Mtui',        'aaaaaaaa-0008-4000-8000-000000000016'),
  ('aaaaaaaa-0007-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'Familia ya Lyimo',       'aaaaaaaa-0008-4000-8000-000000000018'),
  ('aaaaaaaa-0007-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'Familia ya Mollel',      'aaaaaaaa-0008-4000-8000-000000000020')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Events (published, church scope). The member app lists events by date.
--    Kimara is shown as a branch in the location text (events have no branch column).
-- ---------------------------------------------------------------------------
INSERT INTO events (id, church_id, title, description, location, starts_at, ends_at, scope, status, public_published_at, created_at, updated_at) VALUES
  ('aaaaaaaa-0002-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Kongamano la Familia',
   'Kongamano la Familia: mafundisho, michezo na chakula cha pamoja kwa wanandoa, wazazi na vijana. Teaching, games and shared lunch for couples, parents and youth.',
   'Makao Makuu, Ubungo', (current_date + 9) + time '06:00', (current_date + 9) + time '12:00', 'church', 'published', now(), now(), now()),
  ('aaaaaaaa-0002-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Harambee ya Ujenzi wa Kanisa',
   'Harambee ya kuchangia jengo jipya la kanisa. Ahadi na michango ya kila kiwango zinakaribishwa. Fundraising for the new church building. Pledges and gifts of every size are welcome.',
   'Makao Makuu, Ubungo', (current_date + 10) + time '08:30', (current_date + 10) + time '10:00', 'church', 'published', now(), now(), now()),
  ('aaaaaaaa-0002-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Semina ya Ndoa',
   'Semina ya Ndoa kwa wanandoa na wanaotarajia kuoa. Marriage seminar for couples and those preparing for marriage.',
   'Tawi la Kimara, Kimara Stop Over', (current_date + 16) + time '06:00', (current_date + 16) + time '10:00', 'church', 'published', now(), now(), now()),
  ('aaaaaaaa-0002-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Tamasha la Kwaya',
   'Tamasha la Kwaya ya Mito ya Baraka pamoja na kwaya washirika. Choir concert with Mito ya Baraka choir and partner choirs.',
   'Ukumbi wa Mwenge, Mwenge', (current_date + 23) + time '13:00', (current_date + 23) + time '16:00', 'church', 'published', now(), now(), now()),
  ('aaaaaaaa-0002-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Ubatizo wa Maji',
   'Ubatizo wa maji kwa waumini waliomaliza darasa la ubatizo. Water baptism for members who completed the baptism class.',
   'Makao Makuu, Ubungo', (current_date + 24) + time '10:30', (current_date + 24) + time '12:30', 'church', 'published', now(), now(), now()),
  ('aaaaaaaa-0002-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Ibada ya Krismasi',
   'Ibada maalum ya Krismasi yenye kwaya na ujumbe wa mwanga. Special Christmas service with choir and a message of light.',
   'Makao Makuu, Ubungo', (current_date + 29) + time '06:00', (current_date + 29) + time '08:30', 'church', 'published', now(), now(), now()),
  ('aaaaaaaa-0002-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'Mkesha wa Mwaka Mpya',
   'Mkesha wa shukrani na maombi ya kuukaribisha mwaka mpya. Thanksgiving and prayer vigil to welcome the new year.',
   'Makao Makuu, Ubungo', (current_date + 35) + time '17:00', (current_date + 35) + time '21:30', 'church', 'published', now(), now(), now()),
  ('aaaaaaaa-0002-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'Huduma ya Jamii Mbezi',
   'Huduma ya jamii: kugawa chakula na kutembelea wazee na wagonjwa Mbezi. Community outreach: food distribution and visits to elders and the sick in Mbezi.',
   'Mbezi Beach, Kinondoni', (current_date + 44) + time '05:00', (current_date + 44) + time '09:00', 'church', 'published', now(), now(), now()),
  ('aaaaaaaa-0002-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'Kesha la Wanawake',
   'Kesha la Wanawake: maombi, ushuhuda na mafundisho. Women''s prayer vigil with testimonies and teaching.',
   'Tawi la Kimara, Kimara Stop Over', (current_date + 50) + time '17:00', (current_date + 50) + time '20:00', 'church', 'published', now(), now(), now()),
  ('aaaaaaaa-0002-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', 'Kifungua Kinywa cha Wanaume',
   'Kifungua kinywa cha wanaume: ushauri, maombi na mshikamano. Men''s breakfast with mentoring, prayer and fellowship.',
   'Makao Makuu, Ubungo', (current_date + 51) + time '05:00', (current_date + 51) + time '07:00', 'church', 'published', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Event RSVPs: the test member (going/maybe/declined) and some demo members.
-- ---------------------------------------------------------------------------
INSERT INTO event_rsvps (id, event_id, member_id, church_id, status, attended, created_at, updated_at) VALUES
  ('aaaaaaaa-0003-4000-8000-000000000001', 'aaaaaaaa-0002-4000-8000-000000000001', 'd31935be-db6a-40a3-b2d0-4ceb4e7f36d3', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000002', 'aaaaaaaa-0002-4000-8000-000000000002', 'd31935be-db6a-40a3-b2d0-4ceb4e7f36d3', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000003', 'aaaaaaaa-0002-4000-8000-000000000003', 'd31935be-db6a-40a3-b2d0-4ceb4e7f36d3', '11111111-1111-4111-8111-111111111111', 'maybe',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000004', 'aaaaaaaa-0002-4000-8000-000000000004', 'd31935be-db6a-40a3-b2d0-4ceb4e7f36d3', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000005', 'aaaaaaaa-0002-4000-8000-000000000005', 'd31935be-db6a-40a3-b2d0-4ceb4e7f36d3', '11111111-1111-4111-8111-111111111111', 'declined', false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000006', 'aaaaaaaa-0002-4000-8000-000000000006', 'd31935be-db6a-40a3-b2d0-4ceb4e7f36d3', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000007', 'aaaaaaaa-0002-4000-8000-000000000007', 'd31935be-db6a-40a3-b2d0-4ceb4e7f36d3', '11111111-1111-4111-8111-111111111111', 'maybe',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000008', 'aaaaaaaa-0002-4000-8000-000000000001', 'aaaaaaaa-0008-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000009', 'aaaaaaaa-0002-4000-8000-000000000001', 'aaaaaaaa-0008-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000010', 'aaaaaaaa-0002-4000-8000-000000000002', 'aaaaaaaa-0008-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000011', 'aaaaaaaa-0002-4000-8000-000000000003', 'aaaaaaaa-0008-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000012', 'aaaaaaaa-0002-4000-8000-000000000004', 'aaaaaaaa-0008-4000-8000-000000000024', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000013', 'aaaaaaaa-0002-4000-8000-000000000006', 'aaaaaaaa-0008-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000014', 'aaaaaaaa-0002-4000-8000-000000000006', 'aaaaaaaa-0008-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'maybe',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000015', 'aaaaaaaa-0002-4000-8000-000000000007', 'aaaaaaaa-0008-4000-8000-000000000017', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now()),
  ('aaaaaaaa-0003-4000-8000-000000000016', 'aaaaaaaa-0002-4000-8000-000000000005', 'aaaaaaaa-0008-4000-8000-000000000020', '11111111-1111-4111-8111-111111111111', 'going',    false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Announcements. The member app reads completed campaigns (status = completed).
--    Channel is sms or email. Campaign recipients are not needed for the member view.
-- ---------------------------------------------------------------------------
INSERT INTO campaigns (id, church_id, name, channel, subject, body, status, completed_at, started_at, created_at, updated_at) VALUES
  ('aaaaaaaa-0004-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Harambee ya Ujenzi wa Kanisa', 'sms', NULL,
   'Habari za leo, familia ya Mito ya Baraka. Harambee ya ujenzi wa jengo jipya la kanisa itafanyika Jumapili ijayo baada ya ibada ya pili. Karibuni kwa moyo wa shukrani. (Dear church family, the building fund harambee is on Sunday after the second service. Come with a grateful heart.)',
   'completed', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days'),
  ('aaaaaaaa-0004-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Karibuni Ibada ya Jumapili', 'email', 'Karibuni Ibada ya Jumapili',
   'Ibada ya kwanza ya Jumapili inaanza saa 9:00 asubuhi Makao Makuu, Ubungo. Ibada ya pili ni saa 11:30 asubuhi. Lete rafiki! (Sunday service starts at 9:00 AM at HQ, Ubungo. The second service is at 11:30 AM. Bring a friend!)',
   'completed', now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', now() - interval '2 days'),
  ('aaaaaaaa-0004-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Kongamano la Familia', 'sms', NULL,
   'Kongamano la Familia litaanza saa 3 asubuhi Jumamosi ijayo Makao Makuu. Wenzi, wazazi na vijana wote karibuni. (Family Conference starts at 9:00 AM this Saturday at HQ. Couples, parents and youth welcome.)',
   'completed', now() - interval '5 days', now() - interval '5 days', now() - interval '5 days', now() - interval '5 days'),
  ('aaaaaaaa-0004-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Usajili wa Semina ya Ndoa', 'email', 'Usajili wa Semina ya Ndoa',
   'Semina ya Ndoa itafanyika Tawi la Kimara. Wanandoa na wanaotarajia kuoa karibuni. Tafadhali jisajili kupitia kiongozi wa kikundi chako. (The marriage seminar is at the Kimara branch. Couples and those preparing for marriage are welcome. Please register through your group leader.)',
   'completed', now() - interval '6 days', now() - interval '6 days', now() - interval '6 days', now() - interval '6 days'),
  ('aaaaaaaa-0004-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Ubatizo wa Maji', 'sms', NULL,
   'Ubatizo wa maji utafanyika Jumapili ijayo. Waliomaliza darasa la ubatizo, tafadhali thibitisha kwa kiongozi wa kikundi chako. (Water baptism is on Sunday. Those who finished the baptism class, please confirm with your group leader.)',
   'completed', now() - interval '1 day', now() - interval '1 day', now() - interval '1 day', now() - interval '1 day'),
  ('aaaaaaaa-0004-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Mazoezi ya Kwaya', 'sms', NULL,
   'Kwaya kuu inafanya mazoezi kila Jumatano saa 12 jioni kwa ajili ya Tamasha la Kwaya. Waimbaji wapya karibuni! (The main choir rehearses Wednesdays at 6:00 PM for the Choir Concert. New singers welcome!)',
   'completed', now() - interval '4 days', now() - interval '4 days', now() - interval '4 days', now() - interval '4 days'),
  ('aaaaaaaa-0004-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'Mkesha wa Mwaka Mpya', 'email', 'Mkesha wa Mwaka Mpya',
   'Tutaukaribisha mwaka mpya kwa maombi ya shukrani na kuabudu. Mkesha unaanza saa 2 usiku tarehe 31 Desemba. Familia nzima karibuni. (We welcome the new year with thanksgiving and worship. The vigil starts at 8:00 PM on 31 December. The whole family is welcome.)',
   'completed', now() - interval '7 days', now() - interval '7 days', now() - interval '7 days', now() - interval '7 days'),
  ('aaaaaaaa-0004-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'Mafunzo ya Vikundi vya Nyumbani', 'sms', NULL,
   'Mafunzo ya viongozi wa Vikundi vya Nyumbani yatafanyika Jumamosi ijayo Kimara. Viongozi wote tafadhali fika. (Home Group leaders training is this Saturday at Kimara. All leaders please attend.)',
   'completed', now() - interval '8 days', now() - interval '8 days', now() - interval '8 days', now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Library resources (documents). Member-visible, published, branch scope.
--    storage_key is a placeholder (NOT NULL in schema). No real file exists.
-- ---------------------------------------------------------------------------
INSERT INTO documents (id, church_id, uploaded_by, original_file_name, content_type, size_bytes, storage_key, title, description,
                       visible_to_members, scope, publication_status, resource_type, language, author_speaker, categories,
                       duration_seconds, page_count, published_at, published_by, created_at, updated_at) VALUES
  ('aaaaaaaa-0005-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'mahubiri-imani-inayoshinda-hofu.mp3', 'audio/mpeg', 46200000, 'demo-seed/not-uploaded/0001.mp3',
   'Imani Inayoshinda Hofu', 'Mahubiri: Yoshua 1:9 - "Uwe hodari na moyo wa ushujaa." Faith that overcomes fear. Sermon on Joshua 1:9.', true, 'branch', 'published', 'sermon', 'sw', 'Pastor Joseph Msuya', '["Mahubiri"]'::jsonb, 2820, NULL, now() - interval '20 days', '22222222-2222-4222-8222-222222222222', now() - interval '20 days', now() - interval '20 days'),
  ('aaaaaaaa-0005-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'mahubiri-neema-inatosha.mp3', 'audio/mpeg', 41800000, 'demo-seed/not-uploaded/0002.mp3',
   'Neema Inatosha', 'Mahubiri: 2 Wakorintho 12:9 - "Neema yangu inakutosha." Grace is enough. Sermon on 2 Corinthians 12:9.', true, 'branch', 'published', 'sermon', 'sw', 'Pastor Joseph Msuya', '["Mahubiri"]'::jsonb, 2460, NULL, now() - interval '13 days', '22222222-2222-4222-8222-222222222222', now() - interval '13 days', now() - interval '13 days'),
  ('aaaaaaaa-0005-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'mahubiri-kutafuta-kwanza-ufalme.mp3', 'audio/mpeg', 39100000, 'demo-seed/not-uploaded/0003.mp3',
   'Kutafuta Kwanza Ufalme', 'Mahubiri: Mathayo 6:33 - "Tafuteni kwanza ufalme wa Mungu." Seek first the kingdom of God.', true, 'branch', 'published', 'sermon', 'sw', 'Mch. Godfrey Mrema', '["Mahubiri"]'::jsonb, 2290, NULL, now() - interval '34 days', '22222222-2222-4222-8222-222222222222', now() - interval '34 days', now() - interval '34 days'),
  ('aaaaaaaa-0005-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'mahubiri-mwanga-gizani.mp3', 'audio/mpeg', 44900000, 'demo-seed/not-uploaded/0004.mp3',
   'Mwanga Gizani', 'Mahubiri ya Krismasi: Isaya 9:2 - "Watu waliokaa gizani wameona nuru kuu." Light in the darkness. Christmas sermon on Isaiah 9:2.', true, 'branch', 'published', 'sermon', 'sw', 'Pastor Joseph Msuya', '["Mahubiri","Krismasi"]'::jsonb, 2640, NULL, now() - interval '50 days', '22222222-2222-4222-8222-222222222222', now() - interval '50 days', now() - interval '50 days'),
  ('aaaaaaaa-0005-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'devotion-siku-21-kumtegemea-bwana.pdf', 'application/pdf', 1820000, 'demo-seed/not-uploaded/0005.pdf',
   'Devotion ya Siku 21: Kumtegemea Bwana', 'Devotion ya siku 21 kwa wiki tatu za kumtegemea Bwana. A 21-day devotional on trusting the Lord.', true, 'branch', 'published', 'document', 'sw', 'Upendo Mushi', '["Devotion"]'::jsonb, NULL, 34, now() - interval '9 days', '22222222-2222-4222-8222-222222222222', now() - interval '9 days', now() - interval '9 days'),
  ('aaaaaaaa-0005-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'mwongozo-maombi-ya-asubuhi.pdf', 'application/pdf', 640000, 'demo-seed/not-uploaded/0006.pdf',
   'Mwongozo wa Maombi ya Asubuhi', 'Mwongozo wa dakika 15 kila asubuhi: sifa, shukrani, maombi na Neno. A 15-minute morning prayer guide: praise, thanks, prayer and the Word.', true, 'branch', 'published', 'document', 'sw', 'Idara ya Maombi', '["Maombi"]'::jsonb, NULL, 12, now() - interval '30 days', '22222222-2222-4222-8222-222222222222', now() - interval '30 days', now() - interval '30 days'),
  ('aaaaaaaa-0005-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'somo-la-biblia-ruthu.pdf', 'application/pdf', 905000, 'demo-seed/not-uploaded/0007.pdf',
   'Somo la Biblia: Kitabu cha Ruthu', 'Mwongozo wa somo la Ruthu: uaminifu, ukarimu na mpango wa Mungu. Bible-study guide on Ruth: faithfulness, kindness and God''s plan.', true, 'branch', 'published', 'document', 'sw', 'Agnes Mrema', '["Somo la Biblia"]'::jsonb, NULL, 18, now() - interval '16 days', '22222222-2222-4222-8222-222222222222', now() - interval '16 days', now() - interval '16 days'),
  ('aaaaaaaa-0005-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'somo-la-biblia-yakobo-2.pdf', 'application/pdf', 780000, 'demo-seed/not-uploaded/0008.pdf',
   'Somo la Biblia: Yakobo 2 - Imani na Matendo', 'Yakobo 2:14-26: imani bila matendo. Bible-study guide on James 2:14-26: faith and works.', true, 'branch', 'published', 'document', 'sw', 'Obed Moshi', '["Somo la Biblia"]'::jsonb, NULL, 14, now() - interval '24 days', '22222222-2222-4222-8222-222222222222', now() - interval '24 days', now() - interval '24 days'),
  ('aaaaaaaa-0005-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'maisha-ya-ndoa-yenye-baraka.pdf', 'application/pdf', 3400000, 'demo-seed/not-uploaded/0009.pdf',
   'Maisha ya Ndoa Yenye Baraka', 'Kitabu cha ndoa kwa wanandoa wapya na waliopo. A marriage book for new and established couples.', true, 'branch', 'published', 'book', 'sw', 'Emmanuel na Happiness Shayo', '["Ndoa","Familia"]'::jsonb, NULL, 96, now() - interval '40 days', '22222222-2222-4222-8222-222222222222', now() - interval '40 days', now() - interval '40 days'),
  ('aaaaaaaa-0005-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'misingi-ya-imani-mwanachama-mpya.pdf', 'application/pdf', 2900000, 'demo-seed/not-uploaded/0010.pdf',
   'Misingi ya Imani: Kitabu cha Mwanachama Mpya', 'Kitabu cha darasa la wanachama wapya: wokovu, ubatizo, ushirika. New-member class book: salvation, baptism and fellowship.', true, 'branch', 'published', 'book', 'sw', 'Idara ya Mafunzo', '["Mafunzo"]'::jsonb, NULL, 64, now() - interval '60 days', '22222222-2222-4222-8222-222222222222', now() - interval '60 days', now() - interval '60 days'),
  ('aaaaaaaa-0005-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'nitakusifu-bwana-maneno.pdf', 'application/pdf', 310000, 'demo-seed/not-uploaded/0011.pdf',
   'Nyimbo za Kwaya: Nitakusifu Bwana (Maneno)', 'Maneno ya wimbo wa kwaya: Nitakusifu Bwana. Choir lyrics for "Nitakusifu Bwana".', true, 'branch', 'published', 'document', 'sw', 'Kwaya ya Mito ya Baraka', '["Kwaya"]'::jsonb, NULL, 4, now() - interval '11 days', '22222222-2222-4222-8222-222222222222', now() - interval '11 days', now() - interval '11 days'),
  ('aaaaaaaa-0005-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'tamasha-la-desemba-maneno.pdf', 'application/pdf', 360000, 'demo-seed/not-uploaded/0012.pdf',
   'Nyimbo za Tamasha la Desemba (Maneno)', 'Maneno ya nyimbo za Tamasha la Kwaya. Lyrics for the December choir concert.', true, 'branch', 'published', 'document', 'sw', 'Kwaya ya Mito ya Baraka', '["Kwaya"]'::jsonb, NULL, 6, now() - interval '2 days', '22222222-2222-4222-8222-222222222222', now() - interval '2 days', now() - interval '2 days'),
  ('aaaaaaaa-0005-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'ujumbe-wa-vijana-kusimama-imara.mp4', 'video/mp4', 186000000, 'demo-seed/not-uploaded/0013.mp4',
   'Ujumbe wa Vijana: Kusimama Imara', 'Ujumbe kwa vijana kuhusu kusimama imara katika imani. Youth teaching on standing firm in faith.', true, 'branch', 'published', 'video', 'sw', 'Victor Swai', '["Vijana"]'::jsonb, 1980, NULL, now() - interval '18 days', '22222222-2222-4222-8222-222222222222', now() - interval '18 days', now() - interval '18 days'),
  ('aaaaaaaa-0005-4000-8000-000000000014', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'mwongozo-vikundi-vya-nyumbani.pdf', 'application/pdf', 1450000, 'demo-seed/not-uploaded/0014.pdf',
   'Mwongozo wa Vikundi vya Nyumbani', 'Mwongozo kwa viongozi wa Vikundi vya Nyumbani: mikutano, maombi na malezi. Guide for Home Group leaders: meetings, prayer and discipleship.', true, 'branch', 'published', 'document', 'sw', 'Idara ya Vikundi', '["Vikundi"]'::jsonb, NULL, 28, now() - interval '45 days', '22222222-2222-4222-8222-222222222222', now() - interval '45 days', now() - interval '45 days'),
  ('aaaaaaaa-0005-4000-8000-000000000015', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'sauti-ya-maombi-dakika-10.mp3', 'audio/mpeg', 9800000, 'demo-seed/not-uploaded/0015.mp3',
   'Sauti ya Maombi: Dakika 10', 'Maombi ya kutafakari ya dakika kumi kwa mwanzo wa siku. A ten-minute guided prayer to start the day.', true, 'branch', 'published', 'audio', 'sw', 'Pendo Temba', '["Maombi"]'::jsonb, 620, NULL, now() - interval '26 days', '22222222-2222-4222-8222-222222222222', now() - interval '26 days', now() - interval '26 days')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Inbox notifications for the test user (4 unread, 6 read).
--    Templates match the producers: events.created and library.document_published.
--    source_key is unique, so it uses this seed's own prefix.
-- ---------------------------------------------------------------------------
INSERT INTO inbox_notifications (id, user_id, church_id, type, template_key, template_data, target_type, target_params, source_key, created_at, read_at) VALUES
  ('aaaaaaaa-0006-4000-8000-000000000001', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'event_created', 'events.created', '{"title": "Kongamano la Familia"}'::jsonb, 'event', '{"eventId": "aaaaaaaa-0002-4000-8000-000000000001"}'::jsonb, 'mobile-demo:inbox:01', now() - interval '2 hours', NULL),
  ('aaaaaaaa-0006-4000-8000-000000000002', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'document_published', 'library.document_published', '{"title": "Imani Inayoshinda Hofu"}'::jsonb, 'library_resource', '{"resourceId": "aaaaaaaa-0005-4000-8000-000000000001"}'::jsonb, 'mobile-demo:inbox:02', now() - interval '1 day', NULL),
  ('aaaaaaaa-0006-4000-8000-000000000003', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'event_created', 'events.created', '{"title": "Harambee ya Ujenzi wa Kanisa"}'::jsonb, 'event', '{"eventId": "aaaaaaaa-0002-4000-8000-000000000002"}'::jsonb, 'mobile-demo:inbox:03', now() - interval '1 day', now() - interval '20 hours'),
  ('aaaaaaaa-0006-4000-8000-000000000004', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'event_created', 'events.created', '{"title": "Semina ya Ndoa"}'::jsonb, 'event', '{"eventId": "aaaaaaaa-0002-4000-8000-000000000003"}'::jsonb, 'mobile-demo:inbox:04', now() - interval '3 days', now() - interval '3 days' + interval '1 hour'),
  ('aaaaaaaa-0006-4000-8000-000000000005', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'document_published', 'library.document_published', '{"title": "Devotion ya Siku 21: Kumtegemea Bwana"}'::jsonb, 'library_resource', '{"resourceId": "aaaaaaaa-0005-4000-8000-000000000005"}'::jsonb, 'mobile-demo:inbox:05', now() - interval '4 days', NULL),
  ('aaaaaaaa-0006-4000-8000-000000000006', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'event_created', 'events.created', '{"title": "Tamasha la Kwaya"}'::jsonb, 'event', '{"eventId": "aaaaaaaa-0002-4000-8000-000000000004"}'::jsonb, 'mobile-demo:inbox:06', now() - interval '5 days', now() - interval '4 days'),
  ('aaaaaaaa-0006-4000-8000-000000000007', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'event_created', 'events.created', '{"title": "Ubatizo wa Maji"}'::jsonb, 'event', '{"eventId": "aaaaaaaa-0002-4000-8000-000000000005"}'::jsonb, 'mobile-demo:inbox:07', now() - interval '6 days', now() - interval '5 days'),
  ('aaaaaaaa-0006-4000-8000-000000000008', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'document_published', 'library.document_published', '{"title": "Somo la Biblia: Kitabu cha Ruthu"}'::jsonb, 'library_resource', '{"resourceId": "aaaaaaaa-0005-4000-8000-000000000007"}'::jsonb, 'mobile-demo:inbox:08', now() - interval '8 days', now() - interval '7 days'),
  ('aaaaaaaa-0006-4000-8000-000000000009', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'event_created', 'events.created', '{"title": "Ibada ya Krismasi"}'::jsonb, 'event', '{"eventId": "aaaaaaaa-0002-4000-8000-000000000006"}'::jsonb, 'mobile-demo:inbox:09', now() - interval '10 days', NULL),
  ('aaaaaaaa-0006-4000-8000-000000000010', '30a348f3-067c-4318-971e-a1ddef3c0d1a', '11111111-1111-4111-8111-111111111111', 'event_created', 'events.created', '{"title": "Mkesha wa Mwaka Mpya"}'::jsonb, 'event', '{"eventId": "aaaaaaaa-0002-4000-8000-000000000007"}'::jsonb, 'mobile-demo:inbox:10', now() - interval '12 days', now() - interval '11 days')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Church profile: not changed. churches.location, lead_pastor_name, phone,
--    email and description are already set on the DEV church row. The member app
--    shows name, location, description and lead pastor from that row.
--    Prayer requests are not seeded: the member app only submits them and
--    never lists them. Second branch (Kimara) is shown as a location string
--    on events only, because there is no branch table for the member app.
-- ---------------------------------------------------------------------------

COMMIT;
