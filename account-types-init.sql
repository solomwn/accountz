-- Account types: asset (default) and liability (loans, credit)

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS account_type VARCHAR NOT NULL DEFAULT 'asset';

UPDATE accounts
SET account_type = 'asset'
WHERE account_type IS NULL OR account_type = '';
