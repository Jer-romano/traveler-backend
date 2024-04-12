CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(25) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name VARCHAR(25),
  last_name VARCHAR(25),
  profile_image TEXT,
  about TEXT
);

CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users ON DELETE CASCADE,
  title TEXT NOT NULL
);

CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  file_url TEXT NOT NULL,
  trip_id INTEGER REFERENCES trips ON DELETE CASCADE,
  caption TEXT,
  tag1 VARCHAR(25),
  tag2 VARCHAR(25),
  tag3 VARCHAR(25)
);

CREATE TABLE suggestions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users ON DELETE CASCADE,
  suggestion TEXT NOT NULL
);

CREATE TABLE follows (
  user_being_followed_id INTEGER REFERENCES users ON DELETE CASCADE,
  user_following_id INTEGER REFERENCES users ON DELETE CASCADE
);