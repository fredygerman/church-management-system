-- =============================================================================
-- DEV ONLY cleanup for mobile-demo-data.sql
--
-- Deletes only rows whose ids match the demo id families used by the seed
-- (aaaaaaaa-0000 .. aaaaaaaa-0008). Children are deleted before parents.
-- Never run against production.
-- Run with: psql -v ON_ERROR_STOP=1 -f mobile-demo-data.cleanup.sql
-- =============================================================================

BEGIN;

DELETE FROM inbox_notifications WHERE id::text LIKE 'aaaaaaaa-0006-%';
DELETE FROM event_rsvps         WHERE id::text LIKE 'aaaaaaaa-0003-%';
DELETE FROM campaigns           WHERE id::text LIKE 'aaaaaaaa-0004-%';
DELETE FROM documents           WHERE id::text LIKE 'aaaaaaaa-0005-%';
DELETE FROM service_sessions    WHERE id::text LIKE 'aaaaaaaa-0001-%';
DELETE FROM service_types       WHERE id::text LIKE 'aaaaaaaa-0000-%';
DELETE FROM events              WHERE id::text LIKE 'aaaaaaaa-0002-%';
DELETE FROM families            WHERE id::text LIKE 'aaaaaaaa-0007-%';
DELETE FROM members             WHERE id::text LIKE 'aaaaaaaa-0008-%';

COMMIT;
