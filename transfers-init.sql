-- Transfer support: single-row model with source (account_id) and destination (to_account_id)

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT;

INSERT INTO categories (name, type, color)
VALUES ('Transfer', 'expense', '#64748b')
ON CONFLICT (name) DO NOTHING;
