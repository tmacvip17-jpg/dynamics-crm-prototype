-- Dynamics 365 CRM - Supabase Database Schema
-- Migration: 001_create_tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    primary_contact TEXT,
    email TEXT,
    website TEXT,
    fax TEXT,
    parent_account TEXT,
    ticker_symbol TEXT,
    street TEXT,
    state TEXT,
    zip TEXT,
    country TEXT,
    annual_revenue NUMERIC(15, 2) DEFAULT 0,
    employees INTEGER DEFAULT 0,
    owner TEXT DEFAULT 'Alex Wu',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    job_title TEXT,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    account_name TEXT,
    email TEXT,
    phone TEXT,
    mobile_phone TEXT,
    preferred_contact_method TEXT DEFAULT 'Any',
    owner TEXT DEFAULT 'Alex Wu',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OPPORTUNITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    account_name TEXT,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    contact_name TEXT,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    est_close_date DATE,
    est_revenue NUMERIC(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'In Progress',
    stage TEXT DEFAULT 'Qualify',
    stage_index INTEGER DEFAULT 0,
    description TEXT,
    purchase_timeframe TEXT DEFAULT 'This Quarter',
    owner TEXT DEFAULT 'Alex Wu',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    status TEXT DEFAULT 'New',
    source TEXT DEFAULT 'Web',
    rating TEXT DEFAULT 'Warm',
    job_title TEXT,
    phone TEXT,
    email TEXT,
    company_name TEXT,
    website TEXT,
    owner TEXT DEFAULT 'Alex Wu',
    stage_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPETITORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    website TEXT,
    ticker_symbol TEXT,
    strengths TEXT,
    weaknesses TEXT,
    owner TEXT DEFAULT 'Alex Wu',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    activity_type TEXT DEFAULT 'Task',
    regarding TEXT,
    regarding_id UUID,
    priority TEXT DEFAULT 'Normal',
    due_date DATE,
    status TEXT DEFAULT 'Open',
    description TEXT,
    assignee TEXT DEFAULT 'Alex Wu',
    owner TEXT DEFAULT 'Alex Wu',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TIMELINE / NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS timeline_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL, -- 'account', 'contact', 'opportunity', 'lead', 'competitor'
    entity_id UUID NOT NULL,
    entry_type TEXT DEFAULT 'note', -- 'note', 'activity', 'post'
    icon TEXT DEFAULT 'note',
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT[], -- e.g. ['Completed', 'Outbound']
    created_by TEXT DEFAULT 'Alex Wu',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_opportunities_account_id ON opportunities(account_id);
CREATE INDEX idx_opportunities_contact_id ON opportunities(contact_id);
CREATE INDEX idx_activities_regarding_id ON activities(regarding_id);
CREATE INDEX idx_timeline_entity ON timeline_entries(entity_type, entity_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for development (adjust for production)
CREATE POLICY "Allow all access" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON competitors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON timeline_entries FOR ALL USING (true) WITH CHECK (true);
