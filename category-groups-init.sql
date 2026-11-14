-- Optional grouping label for categories (e.g. Utilities, Education)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS group_name VARCHAR;
