-- Single-origin beans identify by origin + farm rather than a name
ALTER TABLE beans ALTER COLUMN name DROP NOT NULL;
ALTER TABLE beans ADD COLUMN origin text;
ALTER TABLE beans ADD COLUMN farm   text;
