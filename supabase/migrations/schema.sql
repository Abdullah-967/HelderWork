-- =============================================================================
-- HELDERWERK UNIFIED DATABASE SCHEMA
-- =============================================================================
-- Description: Complete consolidated schema for shift management platform
-- Version: 1.0 (Unified from migrations 001-012)
-- Date: 2025-12-28
--
-- This schema represents the final state after all migrations have been applied.
-- It includes all fixes for RLS recursion issues, auto-user creation, and
-- invite system for manager access control.
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

CREATE TYPE shift_part AS ENUM ('morning', 'noon', 'evening');

-- =============================================================================
-- TABLES
-- =============================================================================

-- ===== USERS TABLE =====
-- Stores user profiles for both managers and employees
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  is_manager BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  workplace_id UUID,
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== WORKPLACES TABLE =====
-- Stores workplace/business information
CREATE TABLE public.workplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_name TEXT UNIQUE NOT NULL,
  manager_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for workplace_id in users table
ALTER TABLE public.users
  ADD CONSTRAINT fk_users_workplace
  FOREIGN KEY (workplace_id) REFERENCES public.workplaces(id) ON DELETE SET NULL;

-- ===== USER_REQUESTS TABLE =====
-- Stores employee shift availability requests
CREATE TABLE public.user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  workplace_id UUID REFERENCES public.workplaces(id) ON DELETE CASCADE,
  requests TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workplace_id)
);

-- ===== SHIFTS TABLE =====
-- Stores individual shift definitions
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplace_id UUID REFERENCES public.workplaces(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_part shift_part NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workplace_id, shift_date, shift_part)
);

-- ===== SHIFT_WORKERS TABLE =====
-- Junction table for shift assignments
CREATE TABLE public.shift_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  comment TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_id, user_id)
);

-- ===== SHIFT_BOARDS TABLE =====
-- Stores weekly shift board configurations
CREATE TABLE public.shift_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplace_id UUID REFERENCES public.workplaces(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  content JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{
    "closed_days": ["friday"],
    "number_of_shifts_per_day": 2
  }',
  requests_window_start TIMESTAMPTZ,
  requests_window_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workplace_id, week_start_date)
);

-- ===== INVITES TABLE =====
-- Manager invitation codes for controlled workplace creation
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,

  -- Constraints
  CONSTRAINT code_not_empty CHECK (length(trim(code)) > 0),
  CONSTRAINT used_at_requires_used_by CHECK (
    (is_used = false AND used_at IS NULL AND used_by IS NULL) OR
    (is_used = true AND used_at IS NOT NULL)
  )
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Users table indexes
CREATE INDEX idx_users_workplace_id ON public.users(workplace_id);
CREATE INDEX idx_users_is_manager ON public.users(is_manager);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_google_id ON public.users(google_id);

-- Workplaces table indexes
CREATE INDEX idx_workplaces_manager_id ON public.workplaces(manager_id);
CREATE INDEX idx_workplaces_business_name ON public.workplaces(business_name);

-- User requests indexes
CREATE INDEX idx_user_requests_user_id ON public.user_requests(user_id);
CREATE INDEX idx_user_requests_workplace_id ON public.user_requests(workplace_id);

-- Shifts indexes
CREATE INDEX idx_shifts_workplace_id ON public.shifts(workplace_id);
CREATE INDEX idx_shifts_date ON public.shifts(shift_date);
CREATE INDEX idx_shifts_date_part ON public.shifts(shift_date, shift_part);
CREATE INDEX idx_shifts_workplace_date ON public.shifts(workplace_id, shift_date);

-- Shift workers indexes
CREATE INDEX idx_shift_workers_shift_id ON public.shift_workers(shift_id);
CREATE INDEX idx_shift_workers_user_id ON public.shift_workers(user_id);

-- Shift boards indexes
CREATE INDEX idx_shift_boards_workplace_id ON public.shift_boards(workplace_id);
CREATE INDEX idx_shift_boards_week_start ON public.shift_boards(week_start_date);

-- Invites table indexes
CREATE INDEX idx_invites_code ON public.invites(code) WHERE is_used = false;
CREATE INDEX idx_invites_is_used ON public.invites(is_used);
CREATE INDEX idx_invites_used_by ON public.invites(used_by) WHERE used_by IS NOT NULL;

-- Partial index for active approved employees
CREATE INDEX idx_active_approved_employees
ON public.users (workplace_id, full_name)
WHERE is_manager = false AND is_approved = true;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- ===== UTILITY FUNCTIONS =====

-- Function: Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Get next Sunday
CREATE OR REPLACE FUNCTION next_sunday()
RETURNS DATE AS $$
BEGIN
  RETURN CURRENT_DATE + ((7 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Check if within request window
CREATE OR REPLACE FUNCTION is_request_window_open(workplace_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  board RECORD;
BEGIN
  SELECT requests_window_start, requests_window_end
  INTO board
  FROM public.shift_boards
  WHERE workplace_id = workplace_uuid
    AND week_start_date = next_sunday()
  LIMIT 1;

  IF board IS NULL THEN
    RETURN false;
  END IF;

  RETURN (NOW() BETWEEN board.requests_window_start AND board.requests_window_end);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user can edit shift
CREATE OR REPLACE FUNCTION can_edit_shift(shift_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_workplace UUID;
  shift_workplace UUID;
BEGIN
  SELECT workplace_id INTO user_workplace
  FROM public.users WHERE id = auth.uid();

  SELECT workplace_id INTO shift_workplace
  FROM public.shifts WHERE id = shift_uuid;

  RETURN user_workplace = shift_workplace AND is_manager(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== RLS-BYPASSING HELPER FUNCTIONS =====
-- These functions run as SECURITY DEFINER (postgres superuser) to bypass RLS
-- and prevent infinite recursion in RLS policies

-- Function: Get current authenticated user's workplace_id
-- Runs as postgres (superuser), bypasses RLS
CREATE OR REPLACE FUNCTION public.get_auth_user_workplace()
RETURNS UUID AS $$
DECLARE
  result UUID;
BEGIN
  -- Query runs with superuser privileges, bypassing RLS
  SELECT workplace_id INTO result
  FROM public.users
  WHERE id = auth.uid();

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Function: Check if current authenticated user is a manager
-- Runs as postgres (superuser), bypasses RLS
CREATE OR REPLACE FUNCTION public.is_auth_user_manager()
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Query runs with superuser privileges, bypassing RLS
  SELECT is_manager INTO result
  FROM public.users
  WHERE id = auth.uid();

  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Legacy function for backward compatibility
CREATE OR REPLACE FUNCTION is_manager(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_uuid AND is_manager = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Legacy function for backward compatibility
CREATE OR REPLACE FUNCTION get_user_workplace(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT workplace_id FROM public.users WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set ownership to postgres (superuser) - CRITICAL for bypassing RLS
ALTER FUNCTION public.get_auth_user_workplace() OWNER TO postgres;
ALTER FUNCTION public.is_auth_user_manager() OWNER TO postgres;

-- ===== INVITE CODE GENERATION =====

-- Function: Generate new invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.invites WHERE code = new_code) INTO code_exists;

    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN new_code;
END;
$$;

-- ===== AUTO-CREATE USER PROFILE =====

-- Function: Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  base_username text;
  final_username text;
  rnd_suffix text;
BEGIN
  -- Generate a base username from metadata or email prefix
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    split_part(NEW.email, '@', 1),
    'user'
  );

  -- Generate a random 4-character suffix (hex) to ensure uniqueness
  rnd_suffix := substring(md5(random()::text) from 1 for 4);

  -- Combine to create final username (e.g., "john_f4a1")
  final_username := base_username || '_' || rnd_suffix;

  -- Fallback if for some reason the above is too long or invalid (unlikely)
  IF length(final_username) < 3 THEN
     final_username := 'user_' || substring(NEW.id::text from 1 for 8);
  END IF;

  INSERT INTO public.users (
    id,
    email,
    username,
    full_name,
    is_manager,
    is_active,
    is_approved,
    google_id,
    avatar_url
  ) VALUES (
    NEW.id,
    NEW.email,
    final_username,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    false, -- Default to employee (not manager)
    true,  -- Active by default
    false, -- Not approved until assigned to workplace
    NEW.raw_user_meta_data->>'sub',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    google_id = COALESCE(EXCLUDED.google_id, public.users.google_id);

  RETURN NEW;
END;
$$;

-- Set ownership and permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger: Auto-update updated_at for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for user_requests
CREATE TRIGGER update_user_requests_updated_at
  BEFORE UPDATE ON public.user_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for shift_boards
CREATE TRIGGER update_shift_boards_updated_at
  BEFORE UPDATE ON public.shift_boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-create user profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- ===== USERS TABLE POLICIES =====

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy: Managers can view employees in their workplace
-- Uses RLS-bypassing functions to prevent recursion
CREATE POLICY "Managers can view workplace employees"
  ON public.users FOR SELECT
  USING (
    public.is_auth_user_manager() = true
    AND workplace_id = public.get_auth_user_workplace()
  );

-- Policy: Managers can approve employees in their workplace
CREATE POLICY "Managers can approve employees"
  ON public.users FOR UPDATE
  USING (
    public.is_auth_user_manager() = true
    AND workplace_id = public.get_auth_user_workplace()
  )
  WITH CHECK (
    public.is_auth_user_manager() = true
    AND workplace_id = public.get_auth_user_workplace()
  );

-- Policy: Users can create their own profile
CREATE POLICY "Users can create own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ===== WORKPLACES TABLE POLICIES =====

-- Policy: Managers can manage their own workplace
CREATE POLICY "Managers can manage own workplace"
  ON public.workplaces FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- Policy: Employees can view their workplace
-- Uses RLS-bypassing function to prevent recursion
CREATE POLICY "Employees can view their workplace"
  ON public.workplaces FOR SELECT
  USING (id = public.get_auth_user_workplace());

-- ===== USER_REQUESTS TABLE POLICIES =====

-- Policy: Users can manage their own requests
CREATE POLICY "Users can manage own requests"
  ON public.user_requests FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Managers can view requests in their workplace
CREATE POLICY "Managers can view workplace requests"
  ON public.user_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workplaces
      WHERE id = user_requests.workplace_id
      AND manager_id = auth.uid()
    )
  );

-- ===== SHIFTS TABLE POLICIES =====

-- Policy: Managers can manage shifts in their workplace
CREATE POLICY "Managers can manage workplace shifts"
  ON public.shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workplaces
      WHERE id = shifts.workplace_id
      AND manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workplaces
      WHERE id = shifts.workplace_id
      AND manager_id = auth.uid()
    )
  );

-- Policy: Employees can view shifts in their workplace
-- Uses RLS-bypassing function to prevent recursion
CREATE POLICY "Employees can view workplace shifts"
  ON public.shifts FOR SELECT
  USING (workplace_id = public.get_auth_user_workplace());

-- ===== SHIFT_WORKERS TABLE POLICIES =====

-- Policy: Managers can manage shift assignments in their workplace
CREATE POLICY "Managers can manage shift assignments"
  ON public.shift_workers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      INNER JOIN public.workplaces w ON s.workplace_id = w.id
      WHERE s.id = shift_workers.shift_id
      AND w.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shifts s
      INNER JOIN public.workplaces w ON s.workplace_id = w.id
      WHERE s.id = shift_workers.shift_id
      AND w.manager_id = auth.uid()
    )
  );

-- Policy: Employees can view their own shift assignments
CREATE POLICY "Employees can view own assignments"
  ON public.shift_workers FOR SELECT
  USING (user_id = auth.uid());

-- ===== SHIFT_BOARDS TABLE POLICIES =====

-- Policy: Managers can manage shift boards in their workplace
CREATE POLICY "Managers can manage workplace boards"
  ON public.shift_boards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workplaces
      WHERE id = shift_boards.workplace_id
      AND manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workplaces
      WHERE id = shift_boards.workplace_id
      AND manager_id = auth.uid()
    )
  );

-- Policy: Employees can view published boards in their workplace
-- Uses RLS-bypassing function to prevent recursion
CREATE POLICY "Employees can view published boards"
  ON public.shift_boards FOR SELECT
  USING (
    is_published = true
    AND workplace_id = public.get_auth_user_workplace()
  );

-- ===== INVITES TABLE POLICIES =====

-- Policy: Block all user access to invites (server-side only)
CREATE POLICY "Block all user access to invites"
  ON public.invites
  FOR ALL
  USING (false);

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

-- Users table permissions
GRANT ALL ON TABLE public.users TO postgres;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.users TO supabase_auth_admin;

-- Invites table permissions
GRANT ALL ON TABLE public.invites TO postgres;
GRANT ALL ON TABLE public.invites TO service_role;

-- Function permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

GRANT EXECUTE ON FUNCTION public.get_auth_user_workplace() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_auth_user_manager() TO authenticated;

GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO postgres;
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO service_role;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Initial manager invite codes
INSERT INTO public.invites (code, notes) VALUES
  ('HELDERWERK2025', 'Initial launch code'),
  ('MANAGER_BETA', 'Beta testing access'),
  ('FOUNDER_ACCESS', 'For founding managers')
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

-- Table comments
COMMENT ON TABLE public.users IS 'Stores user profiles for managers and employees';
COMMENT ON TABLE public.workplaces IS 'Stores workplace/business information';
COMMENT ON TABLE public.user_requests IS 'Stores employee shift availability requests';
COMMENT ON TABLE public.shifts IS 'Stores individual shift definitions';
COMMENT ON TABLE public.shift_workers IS 'Junction table for shift assignments';
COMMENT ON TABLE public.shift_boards IS 'Stores weekly shift board configurations';
COMMENT ON TABLE public.invites IS 'Manager invitation codes for controlled workplace creation';

-- Column comments
COMMENT ON COLUMN public.shift_workers.comment IS 'Manager notes/instructions for this specific worker assignment';
COMMENT ON COLUMN public.invites.code IS 'Unique invite code (case-sensitive)';
COMMENT ON COLUMN public.invites.is_used IS 'Whether this code has been used';
COMMENT ON COLUMN public.invites.used_at IS 'Timestamp when code was used';
COMMENT ON COLUMN public.invites.used_by IS 'User ID who used this code';
COMMENT ON COLUMN public.invites.notes IS 'Optional notes about this invite code';

-- Function comments
COMMENT ON FUNCTION next_sunday() IS 'Returns the next Sunday from current date';
COMMENT ON FUNCTION is_manager(UUID) IS 'Checks if a user has manager privileges';
COMMENT ON FUNCTION get_user_workplace(UUID) IS 'Returns the workplace_id for a user';
COMMENT ON FUNCTION is_request_window_open(UUID) IS 'Checks if shift request window is currently open';
COMMENT ON FUNCTION can_edit_shift(UUID) IS 'Checks if current user can edit a specific shift';
COMMENT ON FUNCTION public.get_auth_user_workplace() IS 'Returns workplace_id for auth.uid(). Runs as SECURITY DEFINER (postgres) to bypass RLS and prevent recursion.';
COMMENT ON FUNCTION public.is_auth_user_manager() IS 'Returns true if auth.uid() is a manager. Runs as SECURITY DEFINER (postgres) to bypass RLS and prevent recursion.';

-- =============================================================================
-- END OF UNIFIED SCHEMA
-- =============================================================================
