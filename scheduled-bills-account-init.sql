ALTER TABLE scheduled_bills
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS scheduled_bills_account_id_idx ON scheduled_bills (account_id);
