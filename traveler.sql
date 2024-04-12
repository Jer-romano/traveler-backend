\echo 'Delete and recreate traveler db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE traveler;
CREATE DATABASE traveler;
\connect traveler

\i traveler-schema.sql

\echo 'Delete and recreate traveler_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE traveler_test;
CREATE DATABASE traveler_test;
\connect traveler_test

\i traveler-schema.sql
