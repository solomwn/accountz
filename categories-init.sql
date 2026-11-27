CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR NOT NULL DEFAULT '#6366f1',
  group_name VARCHAR
);

-- Starter categories only for a brand-new database, so re-running this
-- script (e.g. on upgrade) never brings back categories you deleted.
INSERT INTO categories (name, type, color)
SELECT v.name, v.type, v.color
FROM (VALUES
  ('Salary', 'income', '#22c55e'),
  ('Food', 'expense', '#ef4444'),
  ('Rent', 'expense', '#f59e0b'),
  ('Utilities', 'expense', '#8b5cf6'),
  ('Transport', 'expense', '#6366f1'),
  ('Entertainment', 'expense', '#ec4899'),
  ('Healthcare', 'expense', '#14b8a6'),
  ('Other', 'expense', '#94a3b8')
) AS v(name, type, color)
WHERE NOT EXISTS (SELECT 1 FROM categories)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE RESTRICT;

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE RESTRICT;

-- Backfill categories from existing transaction labels
INSERT INTO categories (name, type, color)
SELECT DISTINCT t.category, t.type, '#94a3b8'
FROM transactions t
WHERE t.category IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = t.category)
ON CONFLICT (name) DO NOTHING;

UPDATE transactions t
SET category_id = c.id
FROM categories c
WHERE t.category_id IS NULL
  AND t.category = c.name;

-- Backfill categories from existing budget labels
INSERT INTO categories (name, type, color)
SELECT DISTINCT b.category, b.type, '#94a3b8'
FROM budgets b
WHERE b.category IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = b.category)
ON CONFLICT (name) DO NOTHING;

UPDATE budgets b
SET category_id = c.id
FROM categories c
WHERE b.category_id IS NULL
  AND b.category = c.name;
