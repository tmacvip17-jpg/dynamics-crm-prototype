-- RBAC and User Management Setup

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{"menus": [], "data_access": "own"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles Table (Extends Supabase Auth Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Invitations Table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, expired
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Seed initial roles
INSERT INTO roles (name, description, permissions) VALUES
('Administrator', 'Full system access', '{"menus": ["dashboard", "accounts", "contacts", "opportunities", "leads", "competitors", "activities", "project_plans", "ai-topic-parser", "project-applications", "oems", "oes", "vehicle-models", "settings"], "data_access": "all"}'),
('Manager', 'Management access', '{"menus": ["dashboard", "accounts", "contacts", "opportunities", "leads", "project_plans"], "data_access": "all"}'),
('Sales Representative', 'Standard sales access', '{"menus": ["dashboard", "accounts", "contacts", "opportunities", "leads"], "data_access": "own"}')
ON CONFLICT (name) DO NOTHING;

-- RLS Policies for Roles (Admin only can manage roles)
CREATE POLICY "Admin can manage roles" ON roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    JOIN roles ON profiles.role_id = roles.id 
    WHERE profiles.id = auth.uid() AND roles.name = 'Administrator'
  )
);
CREATE POLICY "Anyone can read roles" ON roles FOR SELECT USING (true);

-- RLS Policies for Profiles
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Invitations
CREATE POLICY "Admin can manage invitations" ON invitations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    JOIN roles ON profiles.role_id = roles.id 
    WHERE profiles.id = auth.uid() AND roles.name = 'Administrator'
  )
);
CREATE POLICY "Public can view invitation by token" ON invitations FOR SELECT USING (status = 'pending');

-- Function to handle new user signup and create a profile
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role_id)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', (SELECT id FROM roles WHERE name = 'Sales Representative'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
