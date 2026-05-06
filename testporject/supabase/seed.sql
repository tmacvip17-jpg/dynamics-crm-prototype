-- Dynamics 365 CRM - Seed Data
-- This script populates the database with initial demo data

-- ============================================
-- ACCOUNTS
-- ============================================
INSERT INTO accounts (id, name, phone, city, primary_contact, email, website, fax, street, state, zip, country, annual_revenue, employees, ticker_symbol) VALUES
('a0000001-0000-0000-0000-000000000001', 'Adventure Works', '555-0152', 'Santa Cruz', 'Nancy Anderson', 'nancy@adventure-works.com', 'www.adventure-works.com', '555-0153', '123 Main St.', 'CA', '95062', 'USA', 50000000, 500, 'AWK'),
('a0000001-0000-0000-0000-000000000002', 'Alpine Ski House', '555-0156', 'Missoula', 'Paul Cannon', 'paul@alpineskihouse.com', 'www.alpineskihouse.com', NULL, '456 Mountain Rd.', 'MT', '59801', 'USA', 25000000, 200, 'ALPH'),
('a0000001-0000-0000-0000-000000000003', 'Blue Yonder Airlines', '555-0144', 'New York', 'Sidney Higa', 'sidney@blueyonderairlines.com', 'www.blueyonderairlines.com', NULL, '789 Sky Blvd.', 'NY', '10001', 'USA', 120000000, 3500, 'BYA'),
('a0000001-0000-0000-0000-000000000004', 'City Power & Light', '555-0136', 'Seattle', 'Scott Konersmann', 'scott@cpandl.com', 'www.cpandl.com', NULL, '321 Energy Way', 'WA', '98101', 'USA', 80000000, 1200, 'CPL'),
('a0000001-0000-0000-0000-000000000005', 'A. Datum Corporation', '555-0158', 'Chicago', 'Rene Valdes', 'rene@adatum.com', 'www.adatum.com', NULL, '100 Data St.', 'IL', '60601', 'USA', 35000000, 800, 'ADC'),
('a0000001-0000-0000-0000-000000000006', 'Contoso Pharmaceuticals', '555-0170', 'San Diego', 'Maria Garcia', 'maria@contoso.com', 'www.contoso.com', NULL, '200 Pharma Ln.', 'CA', '92101', 'USA', 200000000, 5000, 'CTSO'),
('a0000001-0000-0000-0000-000000000007', 'Fabrikam, Inc.', '555-0180', 'Portland', 'John Li', 'john@fabrikam.com', 'www.fabrikam.com', NULL, '300 Fabric Ave.', 'OR', '97201', 'USA', 90000000, 1500, 'FBRK'),
('a0000001-0000-0000-0000-000000000008', 'Litware, Inc.', '555-0190', 'Denver', 'Kim Abercrombie', 'kim@litware.com', 'www.litware.com', NULL, '400 Lite Blvd.', 'CO', '80201', 'USA', 150000000, 4000, 'LITW'),
('a0000001-0000-0000-0000-000000000009', 'CloudCorp Inc.', '555-0200', 'Austin', 'Jane Doe', 'jane@cloudcorp.com', 'www.cloudcorp.com', NULL, '500 Cloud Dr.', 'TX', '73301', 'USA', 45000000, 600, 'CCOR');

-- ============================================
-- CONTACTS
-- ============================================
INSERT INTO contacts (id, first_name, last_name, job_title, account_id, account_name, email, phone, mobile_phone, preferred_contact_method) VALUES
('c0000001-0000-0000-0000-000000000001', 'Rene', 'Valdes', 'Marketing Manager', 'a0000001-0000-0000-0000-000000000005', 'A. Datum Corporation', 'rene@adatum.com', '555-0158', '555-0159', 'Email'),
('c0000001-0000-0000-0000-000000000002', 'Nancy', 'Anderson', 'VP of Sales', 'a0000001-0000-0000-0000-000000000001', 'Adventure Works', 'nancy@adventure-works.com', '555-0152', '555-0153', 'Phone'),
('c0000001-0000-0000-0000-000000000003', 'Paul', 'Cannon', 'CEO', 'a0000001-0000-0000-0000-000000000002', 'Alpine Ski House', 'paul@alpineskihouse.com', '555-0156', '555-0157', 'Any'),
('c0000001-0000-0000-0000-000000000004', 'Sidney', 'Higa', 'IT Director', 'a0000001-0000-0000-0000-000000000003', 'Blue Yonder Airlines', 'sidney@blueyonderairlines.com', '555-0144', '555-0145', 'Email'),
('c0000001-0000-0000-0000-000000000005', 'Jane', 'Doe', 'CTO', 'a0000001-0000-0000-0000-000000000009', 'CloudCorp Inc.', 'jane@cloudcorp.com', '555-0200', '555-0201', 'Any'),
('c0000001-0000-0000-0000-000000000006', 'Bob', 'Smith', 'Technical Lead', 'a0000001-0000-0000-0000-000000000009', 'CloudCorp Inc.', 'bob@cloudcorp.com', '555-0202', '555-0203', 'Email');

-- ============================================
-- OPPORTUNITIES
-- ============================================
INSERT INTO opportunities (id, topic, account_name, account_id, contact_name, contact_id, est_close_date, est_revenue, status, stage, stage_index, description, purchase_timeframe) VALUES
('o0000001-0000-0000-0000-000000000001', '300 Laptops for Sales Team', 'Contoso Pharmaceuticals', 'a0000001-0000-0000-0000-000000000006', 'Maria Garcia', NULL, '2023-11-15', 450000, 'In Progress', 'Develop', 1, 'Large laptop order for the sales team expansion.', 'This Quarter'),
('o0000001-0000-0000-0000-000000000002', 'Server Upgrade Q4', 'Alpine Ski House', 'a0000001-0000-0000-0000-000000000002', 'Paul Cannon', 'c0000001-0000-0000-0000-000000000003', '2023-12-01', 120000, 'In Progress', 'Qualify', 0, 'Upgrading server infrastructure for the ski season.', 'This Quarter'),
('o0000001-0000-0000-0000-000000000003', 'Cloud Migration Project', 'Fabrikam, Inc.', 'a0000001-0000-0000-0000-000000000007', 'John Li', NULL, '2023-10-31', 850000, 'In Progress', 'Propose', 2, 'Full cloud migration from on-premise to Azure.', 'This Year'),
('o0000001-0000-0000-0000-000000000004', 'New CRM Implementation', 'Litware, Inc.', 'a0000001-0000-0000-0000-000000000008', 'Kim Abercrombie', NULL, '2024-01-15', 2100000, 'In Progress', 'Qualify', 0, 'Enterprise CRM system implementation.', 'Next Quarter'),
('o0000001-0000-0000-0000-000000000005', 'Cloud Services Expansion', 'CloudCorp Inc.', 'a0000001-0000-0000-0000-000000000009', 'Jane Doe', 'c0000001-0000-0000-0000-000000000005', '2024-12-15', 150000, 'In Progress', 'Develop', 1, 'Client is looking to migrate their legacy on-premise infrastructure to a hybrid cloud model.', 'This Quarter');

-- ============================================
-- LEADS
-- ============================================
INSERT INTO leads (id, first_name, last_name, topic, status, source, rating, job_title, phone, email, company_name, website, stage_index) VALUES
('l0000001-0000-0000-0000-000000000001', 'Susana', 'Welch', 'Interested in Cloud Services', 'New', 'Web', 'Hot', 'Operations Director', '555-0100', 'susana@example.com', 'Welch Corp', 'www.welchcorp.com', 0),
('l0000001-0000-0000-0000-000000000002', 'John', 'Smith', 'ERP Upgrade Requirements', 'Contacted', 'Referral', 'Warm', 'IT Manager', '555-0101', 'john.smith@example.com', 'Smith Industries', 'www.smithind.com', 0),
('l0000001-0000-0000-0000-000000000003', 'David', 'Jones', 'Mobile App Development', 'Qualified', 'Trade Show', 'Hot', 'Product Manager', '555-0102', 'david@jonestech.com', 'Jones Tech', 'www.jonestech.com', 1);

-- ============================================
-- COMPETITORS
-- ============================================
INSERT INTO competitors (id, name, website, ticker_symbol, strengths, weaknesses) VALUES
('x0000001-0000-0000-0000-000000000001', 'Trey Research', 'www.treyresearch.net', 'TREY', 'Strong software team, well-established brand in enterprise sector.', 'High price point, slower development cycle, legacy tech debt.'),
('x0000001-0000-0000-0000-000000000002', 'Northwind Traders', 'www.northwindtraders.com', 'NWND', 'Global reach, strong brand recognition.', 'Slow support response times, outdated UI.'),
('x0000001-0000-0000-0000-000000000003', 'Margie''s Travel', 'www.margiestravel.com', 'MGTV', 'Niche market expert, excellent customer service.', 'Limited capacity, small team.');

-- ============================================
-- ACTIVITIES
-- ============================================
INSERT INTO activities (id, subject, activity_type, regarding, regarding_id, priority, due_date, status, description, assignee) VALUES
('t0000001-0000-0000-0000-000000000001', 'Follow up on proposal', 'Task', '300 Laptops for Sales Team', 'o0000001-0000-0000-0000-000000000001', 'High', '2023-11-12', 'Open', 'Follow up with the customer about the recent proposal sent.', 'Alex Wu'),
('t0000001-0000-0000-0000-000000000002', 'Introductory call', 'Phone Call', 'Server Upgrade Q4', 'o0000001-0000-0000-0000-000000000002', 'Normal', '2023-11-15', 'Completed', 'Initial call to discuss server upgrade scope.', 'Alex Wu'),
('t0000001-0000-0000-0000-000000000003', 'Send literature', 'Email', 'Alpine Ski House', 'a0000001-0000-0000-0000-000000000002', 'Normal', '2023-11-16', 'Open', 'Send product brochures and pricing information.', 'Alex Wu'),
('t0000001-0000-0000-0000-000000000004', 'Quarterly review', 'Appointment', 'Blue Yonder Airlines', 'a0000001-0000-0000-0000-000000000003', 'High', '2023-11-20', 'Open', 'Quarterly review meeting with the Blue Yonder Airlines team.', 'Alex Wu');

-- ============================================
-- TIMELINE ENTRIES
-- ============================================
INSERT INTO timeline_entries (entity_type, entity_id, entry_type, icon, title, description, tags) VALUES
-- Account: Adventure Works
('account', 'a0000001-0000-0000-0000-000000000001', 'activity', 'event', 'Quarterly Review Meeting', 'Met with the executive team to discuss upcoming expansion plans.', ARRAY['Completed']),
('account', 'a0000001-0000-0000-0000-000000000001', 'activity', 'mail', 'Sent Contract Renewal', 'Emailed the updated SLA documents for next year.', NULL),
-- Contact: Rene Valdes
('contact', 'c0000001-0000-0000-0000-000000000001', 'activity', 'call', 'Initial Outreach', 'Brief call to introduce our new marketing analytics suite. Rene was interested.', ARRAY['Outbound', 'Completed']),
-- Opportunity: Cloud Services Expansion
('opportunity', 'o0000001-0000-0000-0000-000000000005', 'activity', 'mail', 'Sent Proposal Draft', 'Emailed the initial proposal PDF to Jane Doe for review. Waiting for feedback before scheduling follow-up.', NULL),
('opportunity', 'o0000001-0000-0000-0000-000000000005', 'activity', 'call', 'Discovery Call', 'Discussed current infrastructure pain points. Identified key stakeholders and timeline for project kickoff.', ARRAY['Outbound', 'Completed']),
-- Lead: Susana Welch
('lead', 'l0000001-0000-0000-0000-000000000001', 'post', 'description', 'Web Form Submitted', 'Downloaded ''Guide to Hybrid Cloud Migration'' whitepaper.', ARRAY['System']),
-- Competitor: Trey Research
('competitor', 'x0000001-0000-0000-0000-000000000001', 'note', 'note', 'Analysis updated', 'Updated competitive analysis matrix based on their latest product announcement.', NULL);
