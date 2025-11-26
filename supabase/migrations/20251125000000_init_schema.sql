-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. System Tables

-- Companies (Projects)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    currency CHAR(3) DEFAULT 'CNY',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LLM Providers
CREATE TABLE IF NOT EXISTS llm_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name VARCHAR(50) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255), -- Encrypted in app logic, stored as text here
    is_active BOOLEAN DEFAULT TRUE,
    selected_model VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Business Tables

-- Bank Statements
CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    sequence_no VARCHAR(50),
    transaction_id VARCHAR(100),
    own_account_name VARCHAR(255),
    own_account_number VARCHAR(50),
    own_bank_name VARCHAR(255),
    counterparty_name VARCHAR(255),
    counterparty_account_number VARCHAR(50),
    counterparty_bank_name VARCHAR(255),
    currency VARCHAR(10),
    debit_amount DECIMAL(15, 2),
    credit_amount DECIMAL(15, 2),
    transaction_date TIMESTAMP,
    balance DECIMAL(15, 2),
    summary TEXT,
    purpose TEXT,
    channel VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contract_no VARCHAR(100),
    title VARCHAR(255),
    contract_type VARCHAR(50),
    party_a VARCHAR(255),
    party_b VARCHAR(255),
    total_amount DECIMAL(15, 2),
    start_date DATE,
    end_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    verification_status VARCHAR(20) DEFAULT 'pending',
    vectorization_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Clauses
CREATE TABLE IF NOT EXISTS contract_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    contract_id UUID REFERENCES contracts (id) ON DELETE CASCADE,
    section_title VARCHAR(255),
    content TEXT,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    invoice_code VARCHAR(20),
    invoice_number VARCHAR(20),
    total_amount_tax_included DECIMAL(15, 2),
    verification_status VARCHAR(20) DEFAULT 'pending',
    vectorization_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    invoice_id UUID REFERENCES invoices (id) ON DELETE CASCADE,
    item_name VARCHAR(255),
    amount DECIMAL(15, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HR & Payroll Tables

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    employee_id VARCHAR(50),
    name VARCHAR(100),
    department VARCHAR(100),
    position VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Records
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees (id) ON DELETE CASCADE,
    month DATE,
    base_salary DECIMAL(15, 2),
    attendance_days DECIMAL(5, 2),
    probation_status VARCHAR(50),
    overtime_pay DECIMAL(15, 2),
    position_subsidy DECIMAL(15, 2),
    allowance DECIMAL(15, 2),
    performance_bonus DECIMAL(15, 2),
    gross_pay DECIMAL(15, 2),
    social_security_personal DECIMAL(15, 2),
    social_security_backpay_personal DECIMAL(15, 2),
    provident_fund_personal DECIMAL(15, 2),
    income_tax DECIMAL(15, 2),
    net_pay DECIMAL(15, 2),
    remarks TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);