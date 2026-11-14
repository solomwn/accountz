CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('income', 'expense'))
);
