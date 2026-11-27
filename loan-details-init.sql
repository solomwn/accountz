-- Loan details for Loan / Liability accounts (all optional, safe to re-run)

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS lender VARCHAR;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS interest_rate NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS loan_initial_amount NUMERIC(12, 2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS installment_amount NUMERIC(12, 2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS next_payment_date DATE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS loan_end_date DATE;
