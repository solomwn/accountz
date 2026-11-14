CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  currency VARCHAR DEFAULT 'EUR',
  opening_balance DECIMAL DEFAULT 0,
  alert_limit DECIMAL DEFAULT 0,
  notes TEXT,
  account_type VARCHAR NOT NULL DEFAULT 'asset'
);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT;
